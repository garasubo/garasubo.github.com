---
title: "Rustでプログラミングコンテスト"
pubDate: "2018-02-23"
tags: ["rust", "contest"]
description: "Rustでプログラミングコンテストに参加する方法とテクニック"
---
---

最近は熱心にプロコンをやる気力が起きないが、Rustの勉強として気が向いた時にちょくちょくAtCoderの問題をRustで解くということをしている。
AtCoderではRust 1.15.1とちょっと古めのバージョンしか対応していないため（今だとstableが1.24.0）、ちょくちょく不便なこともあるがまあなんとかなっている。
コンパイル言語でJavaやScalaのようなJVMの初期化処理もないおかげで、理不尽なTLEを食らうことは今のところない（とは言ってもABCのD問題程度ではそんなことはそもそも稀か）

最近解いた問題を貼ってみる。まだまだRustには不慣れなので、めちゃくちゃなコードも結構混ざっている。

[D - Wide Flip | ARC088](https://beta.atcoder.jp/contests/arc088/tasks/arc088_b)

方針を考察するのが辛いが実装はシンプルにすむ。[自分の提出](https://beta.atcoder.jp/contests/arc088/submissions/1929886)

[D - 2017-like Number | ABC084](https://beta.atcoder.jp/contests/abc084/tasks/abc084_d)


前処理で2017-like Numberの数を数えればおしまい。なのだが、前処理のテーブルをつくる関数がひどい。make\_memoの引数は借用にするべきだった。
[自分の提出](https://beta.atcoder.jp/contests/abc084/submissions/1930106)

[C - 駆引取引 | みんなのプロコン2018](https://beta.atcoder.jp/contests/yahoo-procon2018-qual/tasks/yahoo_procon2018_qual_c)

メモ化再帰。前処理のテーブルをつくるときに18*18*2^18になる解法
手元では最適化をかけずにコンパイルしたせいか結構遅く感じたが、蓋を開けてみれば比較的余裕だった。　[自分の提出](https://beta.atcoder.jp/contests/yahoo-procon2018-qual/submissions/2093178)

[D - Grid Repainting | ABC088](https://beta.atcoder.jp/contests/abc088/tasks/abc088_d)

よく考えると（というかネタバレツイートを見てしまった）最短距離を求めるだけなのでダイクストラしている。
隣接マスへの移動をループで表現するためdx[] = {-1,0,1,0}という感じの配列をつくるというのを他の言語ではやるのだが、Rustだと配列のインデックスの指定はusize型で行わなければならないため、キャストを連発している。
i32やusize、i64へのキャストはC++では暗黙でやってくれたが、Rustでは明示的にやらないといけないのはいろいろなところで辛い。
もちろん、それで未然に気がつくミスというのもあるのだろうが、多分プロコンでは足を引っ張ることのほうが多そう
[自分の提出](https://beta.atcoder.jp/contests/abc088/submissions/2116091)
