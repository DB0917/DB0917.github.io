---
title: Miller-Rabin / Pollard-Rho 演算法
date: 2026-09-11
tags: 數學 / 隨機 /筆記
description: 隨機絕活
banner:
bannerAlt:
---
# Miller-Rabin

可以在 $O(\log n)$ 量級的時間內判斷一個數是否為質數

## 費馬小定理

費馬小定理說，如果 $N$ 是一個質數，且 $a$ 為一個與 $N$ 互質的正整數，那麼 $N$ 有以下**必要條件**：

$a^{N-1} \equiv 1 \space ( \text{mod } N )$

因此我們如果隨便找到一個底數 $a$ ， 滿足 $a^{N-1} \not\equiv 1 \space ( \text{mod } N )$ ， 那這個 $N$ 就一定不是質數 !

但如果對於所有的底數 $a$，都有 $a^{N-1} \equiv 1 \space ( \text{mod } N )$ ， 就代表 $N$ 就一定是質數了嗎?

**大錯特錯!!**

有一種數字叫做 Carmichael Number ， 他是一種可以騙過費馬小定理的合成數 ， 你可以發現他不會被費馬小定理檢測出來 (例如 : $561$)

## 二次探測定理
 


# Pollard-Rho

## 生日悖論

## 龜兔賽跑演算法

