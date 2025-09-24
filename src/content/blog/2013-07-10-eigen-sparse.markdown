---
title: "Eigenで疎行列を扱う"
pubDate: "2013-07-10"
tags: []
description: "C++ライブラリEigenの疎行列クラスSparseMatrixの使用方法について解説します。"
---

ある方程式とかを解くときに、行列をつくるということはよくやるが、
その内の非ゼロ要素が極端に少ない場合、行列がムダにおおきくなってしまうので、
疎行列用のクラスを使ってやる必要がある。

Eigenの場合、SparseMatrixという疎行列クラスがあるので、これを使えば行列のように
簡単に扱えて便利だった。
boostとかにも疎行列用のクラスはあるのだが、どこのサイトで見たか忘れたが、各種ライブラリと速度比較してEigenはかなり優秀だそうで。

検索しても情報が少ないが、公式のチュートリアルとリファレンスが最もまともな資料だった（ともに英語）。  
[Tutorial page 9 - Sparse Matrix](http://eigen.tuxfamily.org/dox/TutorialSparse.html)  
[SparseMatrix< _Scalar, _Options, _Index > Class Template Reference](http://eigen.tuxfamily.org/dox/classEigen_1_1SparseMatrix.html)

要素のセット方法を探すのに結構手間取った。
個別に要素をセットするときはinsertメソッドを使い、
まとめてセットするならTutorialのFirst
Exampleにあるみたいに、Eigen::Tripletのvectorをつくってから、setFormTripletsでやるのが楽かなって感じ。


