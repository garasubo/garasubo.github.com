---
title: "Spectreとmeltdownの対策"
pubDate: "2018-01-29"
tags: ["security"]
description: "SpectreとMeltdown脆弱性に対する対策手法について"
---

[前回のブログ](2018/01/07/spectre-meltdown.html)でspectreとmeltdownの原理についてまとめたので、今度はその対策についてまとめる。

そもそもspectreとmeltdownはすべてハードウェアそのものに原因があるが、これらの対策はソフトウェアでなんとか防ごうというものである。
また、これらの対策はパフォーマンス低下を伴うが、最終的にはその影響はそこまで大きくなかったようだ。

## Variant 1 (Spectre)
特権レベルで動くソフトウェアが、ユーザーのコードを実行する際の配列境界チェックをかいくぐるというものだった。
対策としてはそもそもそのようなコードを特権環境で動かさないといものがまず挙げられる（LinuxではeBPFを無効化するなど）。
また、コンパイラレベルでこのような脆弱性を生むコードを防ぐというものも挙げられる。
ARMの場合は配列境界チェック用のbuiltin関数を提供している。
https://developer.arm.com/support/security-update/compiler-support-for-mitigations
Windowsもコンパイラを変更し、再コンパイルしたものを配布しているようである。

## Variant 2 (Spectre)
間接ジャンプ予測先をインジェクションすることで、KVMのモジュールなどのアドレスを抜き出し、ゲストOSのメモリの内容を盗み出す攻撃であった。

こちらも特権レベル中で動く既存のコードを利用するものなので、その部分のコードを変更することになる。最も単純な方法としては分岐予測を無効にすることであるが、当然コストがかかる。
これらの方法よりお手軽な方法として[Retpoline](https://support.google.com/faqs/answer/7625886)という手法も公開され、gccやllvmにも実装された。
これは間接ジャンプ命令を書き換え、逆に間接分岐先を予めコントロールしてしまおうといものである。
Intelのプロセッサの場合、普通の間接ジャンプと関数呼び出しから戻る時の間接ジャンプ（スタックに戻り先が記録されているので、その値を読む間接ジャンプによって呼び出し元に戻る）では、使う分岐予測のバッファーが違うことを利用する。
普通の間接ジャンプ命令を、関数呼び出しとスタックの戻り先の書き換えにより実現することによって、分岐予測器を騙し投機実行を止める、というのがRetpolineの概要である。

## Variant 3 (Meltdown)
この脆弱性は、Spectreと違い特権レベルで動くコードに依存せず、完全にユーザーレベルで完結してしまう。
そもそもの原因はカーネルとユーザープログラムの間で同じページテーブルを使っているということなので、これを分離することで解決できる。
LinuxではKPTI（Kernel page-table isolation）と呼ばれる。もともとはKAISERというパッチがmeltdown発覚より前に公開されていて、それをベースとしたもののようだ。
KAISERも同様にカーネルとユーザープログラムの間でのページテーブルを分けるというものであったが、想定していたのはKASLR（kernel address layout randomization）が破られるというものであった(参考：https://gruss.cc/files/kaiser.pdf)。
ページテーブルを分けるということは、TLBフラッシュの頻度を増やすため、アプリケーションによってはパフォーマンスが低下する恐れがあるはずだが、パフォーマンス低下を軽減する方法について言及している資料は自分はまだ見つけていない。

## 参考
- [ARMでの対策について](https://developer.arm.com/support/security-update)
- [Windowsでの対策について](https://blogs.technet.microsoft.com/jpsecurity/2018/01/23/understanding-the-performance-impact-of-spectre-and-meltdown-mitigations-on-windows-systems/)
- [Retpoline](https://support.google.com/faqs/answer/7625886)
