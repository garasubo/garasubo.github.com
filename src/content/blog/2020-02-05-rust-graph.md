---
title: "Rustで循環参照を含むグラフをArc/Rcを使ってつくる"
pubDate: "2020-02-05"
tags: ["rust"]
description: "RustでArcやRcを使って循環参照を含むグラフ構造を実装する手法"
---

Rustで循環参照を含む場合の処理はかなり面倒くさい。
基本的にミュータブルな参照は同時に1つしか持てないのだが、例えば双方向連結リストの場合、あるノードに対してその前のノードとその後ろのノードから参照される必要があるので、この場合どうにかしてミュータブルな参照以外の方法で前後のノードへのアクセス方法を確保する必要がある。

ということで、前回のRust LT会でそのテーマで発表した方がいらっしゃった
{%linkPreview https://speakerdeck.com/u1roh/graph-in-rust-with-unsafe _blank %}
ここで用いられている方法は`unsafe`を使い、生ポインタとTyped Arenaという動的に同じ生存区間のメモリを確保できるライブラリを使う、または自作のメモリプールを使うというものである。
しかし、できれば`unsafe`は使いたくない。さらにいうとstdだけで実現できると嬉しい。

Typed Arenaを使う方法は結構有名で、こちらのブログでも紹介されている
{%linkPreview https://qnighy.hatenablog.com/entry/2017/04/28/070000 _blank %}
ただし、この方法の弱点はメモリを開放する手段がないので、一度ノードをつくってしまうとグラフ全体が生存している間は削除してもメモリが開放されない。
ライフタイムの管理も難しく、設計をうまくしてあげる必要もある。

他の方法としては`Rc`/`Arc`を使う方法がある。
{%linkPreview https://qiita.com/qnighy/items/4bbbb20e71cf4ae527b9#%E5%AF%BE%E7%A7%B0%E3%81%AA%E5%BE%AA%E7%92%B0%E3%83%87%E3%83%BC%E3%82%BF%E3%82%92%E8%A1%A8%E7%8F%BE%E3%81%99%E3%82%8B _blank%}
Rcは参照カウンタ付きのスマートポインタでArcはそのスレッド安全版である。この方法ではRc/Arcのアクセスのための実行時オーバーヘッドおよび参照カウンタ分のメモリオーバーヘッドが発生するが、
代わりにライフタイムは比較的自由に管理でき、ノードのメモリも参照がなくなると自動的に開放してくれる。

注意点としてはRustはメモリリークに関しての保証はないため、Rcで循環参照をつくってしまうとメモリリークを起こすことになる。
そのため、ノード間の連結は弱参照`Weak`で実現し、ノード全体の強参照を保持する親構造体を持つことで、この問題を解決する。
この場合、ノードのコンストラクタは直接呼ぶのではなく、親構造体のメソッド呼び出しとして実態をもらうことになる。
また、ノード内部構造は晒したくないので、ユーザーが触るノード構造体の実態はノード内部構造体への弱参照のラッパになる。

弱参照から内部の値にアクセスするのは失敗する可能性があるので、ノードのメソッドは常に`Result`型で返してあげる必要がある。
また、ノード内部になんらかの値を保持させる場合、そこへのアクセスも少々厄介になる。
今回は、内部値への直接の参照を返すことは諦め、代わりにクロージャーを渡してもらうことにより、内部値の読み込み及び変更を実現した。
実際の実装は以下の通りである。先述のqnighy氏のブログにあった実装をベースにして、ノードの削除、子要素の取得、内部値の読み書きを追加したものである。
Arcを使っているのでスレッド安全でもある。
{%linkPreview https://gist.github.com/garasubo/07f4671a133657ee4f39ff86924c4a54 _blank%}

削除や値の読み書きに対応するために変更した点について説明していく。
ノードの削除は`Graph`の持っている強参照を削除しないとメモリが開放されないため、Graphのメソッドとして実装した。
強参照が`Vec`のどこに格納されているかを指定するため、`NodeInner`に位置を持っておき、それをもとに削除することにした。
```
    pub fn remove_node(&self, node: &Node<T>) -> Result<(), GraphError> {
        let mut lock = self.0.lock().unwrap();
        let rc = node.0.upgrade().ok_or(GraphError::NodeDead)?;
        let id = rc.lock().unwrap().id;
        if id < lock.nodes.len() {
            let tar_node = lock.nodes[id].0.take();
            if tar_node.is_none() {
                Err(GraphError::InvalidNode)
            } else {
                lock.nodes[id].1 = lock.next;
                lock.next = id;
                Ok(())
            }
        } else {
            Err(GraphError::InvalidNode)
        }
    }
```
Vecから特定の要素を削除するのはそこそこにめんどくさく、またそれにより他のノードのインデックスがずれると困るので、強参照をもつVecは`Option`型で値を持っておき、削除された場合は`None`に置き換えることにした。
```
#[derive(Debug, Clone)]
struct GraphInner<T> {
    nodes: Vec<(Option<Arc<Mutex<NodeInner<T>>>>, usize)>,
    next: usize,
}

#[derive(Debug, Clone)]
pub struct Graph<T>(Arc<Mutex<GraphInner<T>>>);
```

削除が頻繁に起こるとVecがNoneで埋め尽くされてしまうので、Noneになった箇所は再利用できるようにした。そのために、グラフには次のNoneの位置を持たせておき、各ノードにはその次のNoneの位置をもたせることで、
Noneの連結リストを構成することで要素の再利用を行うようにしている。VecにNoneが存在しない場合、末尾に要素を追加する。
```
    pub fn new_node(&self, value: T) -> Node<T> {
        let mut lock = self.0.lock().unwrap();
        let next = lock.next;
        let inner = NodeInner {
            value,
            neighbors: Vec::new(),
            id: next,
        };
        
        let node = Arc::new(Mutex::new(inner));
        if next < lock.nodes.len() {
            let node_weak = Node(Arc::downgrade(&node));
            lock.nodes[next].0.replace(node.clone());
            lock.next = lock.nodes[next].1;
            node_weak
        } else {
            let node_weak = Node(Arc::downgrade(&node));
            lock.nodes.push((Some(node.clone()), next + 1));
            lock.next += 1;
            node_weak
        }
    }
```
ただし、あくまで強参照用の要素の再利用であって、ノードそのもののメモリ領域の再利用はしていないので、メモリ効率は改善の余地があると思われる。

ノードの値の読み書きであるがArcやMutexで囲われているので、そのまま参照を返すことはできない。
そこで、内部値の参照を受け取って処理をする関数をもらう、というメソッドをつくっておくことにした。
```
    pub fn read<V, F>(&self, f: F) -> Result<V, GraphError> where F: Fn(&T) -> V {
        let rc = self.0.upgrade().ok_or(GraphError::NodeDead)?;
        let lock = rc.lock().or(Err(GraphError::LockFailure))?;
        let result = f(&lock.value);
        Ok(result)
    }

    pub fn write(&self, val: T) -> Result<(), GraphError> {
        let rc = self.0.upgrade().ok_or(GraphError::NodeDead)?;
        let mut lock = rc.lock().or(Err(GraphError::LockFailure))?;
        lock.value = val;
        Ok(())
    }

    pub fn modify<F>(&self, f: F) -> Result<(), GraphError> where F: Fn(&mut T) {
        let rc = self.0.upgrade().ok_or(GraphError::NodeDead)?;
        let mut lock = rc.lock().or(Err(GraphError::LockFailure))?;
        f(&mut lock.value);
        Ok(())
    }
```
注意点としては、渡す関数中で同一ノードへのアクセスを試みると、Mutexが衝突してデッドロックないし`LockFailure`が返ってしまう。
`Node`はノードの実態への弱参照であるため、複製が可能であるためにコンパイルそのものは通ってしまう。
また、弱参照であるために、削除されたノードである可能性が常に存在するため、すべてのメソッドは`Result`型で返ってくる。

## 弱点・TODO
強参照は1つしかないため、ノードの実態のメモリリークはないが、Arcの参照カウンタのための領域は弱参照が残り続けている限り開放されない。
ノード削除の際、他のノードとの連結情報までは削除をおこなっていないため、連結情報としてその弱参照は生き続ける可能性があるし、そもそも`Node`型自体は複製可能なので、別の箇所で弱参照が生き続けることもありえる。
一応、ノードの子要素の無効な弱参照は適宜消してあげる関数はつくっておいたが、どこで呼び出すかが問題となる。

また、異なる`Graph`のノードを識別できていないため、`remove_node`に別のグラフのノードを渡してあげることで挙動がおかしくなる危険性がある。
対策としてはノードになんらかのGraphの識別子をもたせ、それをチェックすることになると思われる（`GraphInner`への弱参照とか？）。

あとは、隣接ノード情報周りは作り込みが甘いので、もうちょっとなんとかしたい。

また、スレッド安全性を捨てればArcがRcになり、Mutexも取れるので実行時オーバーヘッドがマシになると思われるので、そのバージョンもつくってみたい。
あと、オーバーヘッドがどうのとか言っているが、ちゃんとパフォーマンス計測はしていないので、他のバージョンもつくってやってみたい。

進捗ダメです。
