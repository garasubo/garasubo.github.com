---
title: "This Week in Rustで振り返る今年のRust"
pubDate: "2019-12-07"
tags: ["rust"]
description: "This Week in Rustを基に2019年のRustの動向を振り返る"
---

これは[Rustその2 Advent Calendar 2019](https://qiita.com/advent-calendar/2019/rust2)7日目の記事です。
去年も参加したRust Advent Calendarなのですが、今年は[その3](https://qiita.com/advent-calendar/2019/rust3)まであるようですね。Rustの人気が年々盛り上がっている証拠でしょうか。

## This Week in Rust
[This Week in Rust](https://this-week-in-rust.org/)とは、毎週Rust関連のブログ記事やRustコンパイラへの変更などを紹介してくれるニュースレターです。
すべて英語の記事なので、正直読むのがしんどいのですが、気になったタイトルがあったら読むようにしています。
今回は今年のThis Week in Rustで紹介された記事からいくつかピックアップして紹介して、今年のRustコミュニティの動向を振り返ってみようと思います。
なお、選んだ記事は自分の興味にものすごく影響を受けているため分野は偏り気味です。

## Rustで既存プロダクトを置き換える話
C/C++やPythonで書かれたプロジェクトをRustで置き換えるという話をかなり見るようになりました。

{% linkPreview https://medium.com/dwelo-r-d/we-rewrote-our-iot-platform-in-rust-and-got-away-with-it-2c8867c61b67? _blank %}
Pythonで書かれていたIoTプラットフォームをRustで置き換えたという話です。
スケールさせるためにより高速な言語に置き換えねばならなかったこと、様々な技術的負債が溜まってしまったという状況で、Rustに置き換えるという選択をとったようです。
当然、C/C++も候補に入りましたが、nullポインタやキャストのバグなど、言語の性質上起こり得るバグを[Part2](https://medium.com/dwelo-r-d/abusing-fire-for-light-a6e6774289fd)で紹介し、
[Part3](https://medium.com/dwelo-r-d/designing-around-our-flaws-e0fccd7070af)でRustならそれが起こらないことを説明しています。

[Oreboot (PDF)](https://osfc.io/uploads/talk/paper/23/Oreboot.pdf)

CorebootというオープンソースのブートローダーをRustで書き直すOrebootというプロジェクトの紹介です。
Rustを選んだ理由から現在のOrebootの設計・進捗状況を説明しています。現状はQEMUのArmやRISC-Vのボードで動いているようです。

{% linkPreview https://about.houqp.me/posts/rusty-c/ _blank %}
自作キーボードでおなじみのキーボード用ファームウェアのQMKをRustで書き直す話です。
C言語で書かれたものをどうRustで表現するか、RustとC言語を連携させるテクニックがまとまっていていいと思いました。

## 組込み分野での応用
Rust Embeddedグループが去年発足したように、組込み分野への応用はRustの用途として注目されている分野のひとつです。

{% linkPreview https://medium.com/@ly.lee/hosting-embedded-rust-apps-on-apache-mynewt-with-stm32-blue-pill-c86b119fe5f _blank %}
Apache MynewtというリアルタイムOSを用いて、STM32 Blue Pillというマイクロコントローラ上でRustのアプリを動かす話です。
なぜC言語ではなくRustがいいのかというところから、実際にどのようにしてプロジェクトに組み込むのかまで詳しく説明されています。

## C言語のとの併用
Rustの魅力のひとつはC言語と互換性をもたせることができるため、Cで書かれたライブラリを呼び出したり、逆にC言語側からRustのライブラリを呼び出すこともできます。

{% linkPreview http://hotforknowledge.com/2019/07/14/6-rust-the-new-c/ _blank %}
RustのプロジェクトにC言語のライブラリをどのように取り込むか、という話です。
LMDB、Blosc、SQLiteという現実のライブラリをプロジェクトに取り込んでみて、ビルドの設定の仕方、機能の呼び出し方などを解説しています。

## 安全性
Microsoftが、多くのバグがメモリの安全性の問題に由来しているため、その解決策のひとつとしてRustを提案しているというブログが公開されました。
{% linkPreview https://msrc-blog.microsoft.com/2019/07/16/a-proactive-approach-to-more-secure-code/ _blank %}

続くブログでは、なぜRustがC/C++の代わりとして注目しているかが説明されています。
{% linkPreview https://msrc-blog.microsoft.com/2019/07/22/why-rust-for-safe-systems-programming/ _blank %}
C/C++のように低レベルでのパフォーマンスコントロールができる一方で、C/C++より強力な安全性の保証をしてくれます。
また、メモリ関連の安全性を犯しにくい、型システムも強力で表現力が高いことなども理由に挙げられています。

Amazonも去年、[Firecracker](https://github.com/firecracker-microvm/firecracker)というRust製のVMMをオープンソースプロジェクトとして公開し注目されましたが、様々な大企業がRustに注目しだしている、ということがわかります。

## async/await
今年のRustの変更で一番大きな注目を集めたのはasync/awaitの追加でしょう。それに関連する記事もいくつか紹介はされていました。
が、自分自身がasync/awaitの仕様をまったく追えていないので、今回は紹介しないでおきます。

Rustは進歩が早く、まだまだ学ぶことが多いですが、来年もRustをやっていきたいと思います。
