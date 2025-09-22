---
title: "Spectre and Meltdownまとめ"
pubDate: "2018-01-07"
tags: ["security"]
description: "IntelCPUの脆弱性であるSpectreとMeltdownについての技術的まとめ"
---

IntelのCPUの重大なバグが発覚した、のような騒ぎから話題になったspectreとmeltdownについて調べた。

基本的にはGoogle Project Zeroチームによるブログポストが最も信頼性の高くかつまとまっているので、この記事はそれのまとめ的なもの
https://googleprojectzero.blogspot.jp/2018/01/reading-privileged-memory-with-side.html

## 発端
おそらく[ここの記事](https://www.theregister.co.uk/2018/01/02/intel_cpu_design_flaw/)でIntelのCPUにバグが発覚したと報じ他のメディアがこれを拡散。
ただ、情報がかなり曖昧で、本当にIntel固有なものなのか、従来から指摘されている攻撃の可能性（現実的には不可能だから対処する必要はない）のことではないかなど様々な憶測が飛び交い
最終的にはGoogleやIntelが声明を発表し、去年から発覚していた攻撃手法で近日発表する予定だったが情報がリークしてしまったので、前倒しで詳細を公表するとのことだった。

## 概要

spectreとmeltdownは３つの攻撃手法のことを指す。どれもCPUの性質を利用することによりカーネルによって保護されている領域に対してユーザースペースからアクセスしようというものである。

当初、Intel CPUのバグと言われていたが、CPUが誤動作するため保護が破れる、という類のものではない。
これらはキャッシュや分岐予測といった様々なCPUで広く用いられている高速化手法により発生するCPUのある種の癖を利用してメモリを読みだそうとするものである。
よって、Intel固有のものではなく、AMDやARMでも起こりうると明記されている。
しかし、影響を受ける可能性が高いのはIntelのCPUでProject Zeroのブログでも主にIntelアーキテクチャでの話を元に進められている。

## 攻撃の原理

spectreとmeltdownの原理について簡単にブログから要約する。spectreがvariant 1と2を指し、meltdownがvariant 3を指す。

### Variant 1: 境界チェックバイパス

カーネル内の境界チェックをすり抜けて、アクセスが禁止されている領域の値を読みだす方法。
この方法はユーザーがカーネルに処理を依頼して、カーネル内で処理を実行するアプリケーションを利用した攻撃である。
今回のProof of Concept(PoC)ではeBPF（extended Berkeley Packet Filter）というユーザーによってパケットフィルターを定義するインターフェースを利用している。

この攻撃で肝になるのは[投機的実行](https://ja.wikipedia.org/wiki/%E6%8A%95%E6%A9%9F%E7%9A%84%E5%AE%9F%E8%A1%8C)である。
これはif文などの条件分岐の結果が決定する前に、どちらの結果になるかを予想して処理を進めてしまうCPUの高速化手法である。
本来であればその予想が外れた場合、投機的実行による変更は巻き戻されそれが外部に漏れることはない。
しかし、この失敗した投機的実行内でメモリアクセスが行われていた場合、そのメモリの結果はキャッシュに残る。
キャッシュに残るだけではユーザーがその値の中身を読み取ることはできないが、キャッシュにデータが残っている場合、そのアドレスへのアクセス時間は短くなる。これを利用する。

具体的なコードのスニペットをProject Zeroのブログポストより引用する
```
struct array {
    unsigned long length;
    unsigned char data[];
};
struct array *arr1 = ...; /* small array */
struct array *arr2 = ...; /* array of size 0x400 */
/* >0x400 (OUT OF BOUNDS!) */
unsigned long untrusted_offset_from_caller = ...;
if (untrusted_offset_from_caller < arr1->length) {
    unsigned char value = arr1->data[untrusted_offset_from_caller];
    unsigned long index2 = ((value&1)*0x100)+0x200;
    if (index2 < arr2->length) {
        unsigned char value2 = arr2->data[index2];
    }
}
```
`untrusted_offset_from_caller`というのが読まれたくないメモリ領域のアドレス。本来であればif文による境界チェックによって処理は実行されないはずだが、
`arr1->length`の値がキャッシュに載っていない場合、メモリロードによる待ちが発生しその間に投機的実行によってif文の中身が実行される。
`untrusted_offset_from_caller`の値がキャッシュに乗っていた場合、`value`の値がすぐに読みこまれ投機的実行が進む。
`index2`の値は`value`の値によって0x200か0x300となり、このアドレスのメモリ領域のアドレスはユーザーがアクセスできる。
投機的実行によってこのメモリ領域もキャッシュに乗る。
最終的にこの投機的実行の結果は破棄されるのだが、0x200がキャッシュに乗っているか0x300がキャッシュに乗っているかで`value`の1bitが読み込めてしまう。
キャッシュ乗っているか否かは、メモリロードの時間によって分かってしまう。

### Variant 2: 分岐ターゲットインジェクション

この攻撃では、[KVM](https://ja.wikipedia.org/wiki/Kernel-based_Virtual_Machine)上でのゲストマシンから同じCPU上での他のゲストマシンのページアドレスやKVMのモジュールがどこにロードされているかを特定するものである。
当然、アドレスが分かっただけではMMUによって保護されているはずなのでそのまま中身を知ることはできない。が、PoCではeBPFを使うことによってデータを取り出している
（ここの詳細は理解できなかった。[ROP](http://crypto.stanford.edu/~blynn/rop/)の要領でコードを実行させて、Variant 1と同じ方法でキャッシュからデータを引き出す？）。

この攻撃ではindirection branch（分岐先のアドレスがメモリ上にあるような分岐）の分岐予測を利用する。indirection branchの分岐先がキャッシュされていない場合、そのロードの時間がかかる。
そのため、投機的実行のためにどのアドレスに分岐するか、その命令アドレスに対してどこに分岐したかの履歴をもとに予測する機構がついている。
この機構の詳細は公開されていない。そのため、この機構のリバースエンジニアリングから説明されている。
そのリバースエンジニアリングの結果を元に、予め分岐予測機構の状態を設定し、hyper callなどの実行時間の差から分岐予測が失敗したかどうかを知ることでアドレスを知る、というのが概要である。

正直、ここの説明は自分では理解できない点も多かった。

### Variant 3: Rogue data cache load
（1/13　補足）cyber.wtfのブログ内容についても言及を加え、ARMプロセッサの例についても補足

ユーザースペースからカーネル空間のメモリを直接読む攻撃。これがMeltdownと呼ばれるもので、今回の騒動で最も広い範囲に影響が出ると考えられているようだ。

詳細はこちらのブログ参照
https://cyber.wtf/2017/07/28/negative-result-reading-kernel-memory-from-user-mode/

基本的なアイデアとしては、メモリの権限設定のチェックが完了する前にプロセッサはメモリの読み込みを投機に実行していて、Variant 1と同じ要領でメモリの値が読めるというもののようだ。
コードのスニペットを上記ブログより引用する
```
Mov rax, [somekerneladdress]
And rax, 1
Mov rbx,[rax+Someusermodeaddress]
```
カーネル空間からのメモリ呼び出しの直後にその値に依存するユーザー空間アドレスへの読み込みを行い、その後、どこがキャッシュされているかでそのカーネル空間のメモリの値を確定させようというものである。
ページテーブルによる例外が発生する前に、後ろの2つの命令が投機的実行されると可能になってしまうというわけである。
ここで後ろ2つの命令が投機的実行されてしまうとVariant 1と同じように、どのアドレスがキャッシュされているかによってユーザー空間からカーネル空間のメモリの値が読める。

しかし、cyber.wtfではこのような不正なアクセスをした場合は投機的実行中raxの値が常に0になるような挙動をしたので結果的には失敗した、としている。
Googleのチームは、cyber.wtfチームがやっていたカーネル空間をキャッシュするために呼び出していたprefetch命令を使うのを辞めたところうまくいった、としている。

また、ARMプロセッサの場合、この攻撃の亜種としてカーネルモードでしか読めないシステムレジスタを読み出せてしまうことがある。
[ARM社のwhite paper](https://developer.arm.com/support/security-update/download-the-whitepaper)よりコードを引用する。

```
LDR R1, [R2] ; arranged to miss in the cache
CMP R1, #0
BEQ over ; This will be taken
MRC p15, 0, R3, c2, c0, 0 ; read of TTBR0
LSL R3, R3, #imm
AND R3, R3, #0xFC0
LDR R5, [R6,R3] ; R6 is  an PL0 base address
over
```
4行目のコードがTTBR0というページテーブルに関する情報が格納されているシステムレジスタをR3レジスタに格納して、
その結果を使ってユーザー空間のアドレスを決定してロードする、ということをしている（PL0とはARMでのユーザーモードを意味する）。
3行目が分岐命令で、本来ならばoverまで飛ぶのだが、分岐予測が失敗すると4行目以降が投機的に実行され、
最終的にVariant 1と同じようにどのユーザーアドレスがキャッシュされているかでシステムレジスタの値が読めてしまう。



## まとめ
とりあえずProject Zeroのブログポストのうち、攻撃原理に関わるところを中心にまとめてみた。
Intelプロセッサのアーキテクチャやセキュリティ分野にそこまで詳しいわけではないので、誤りも多々含まれるかもしれないが、見つけたらご指摘お願いします。

ARMなどからも発表があるのでそちらの方も読み込んだらまた補足をしていきたいと思う。
