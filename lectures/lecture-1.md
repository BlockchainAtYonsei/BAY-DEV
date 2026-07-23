# 이더리움 네트워크 큰 그림

geth 코드를 열기 전에, 이더리움이 전체적으로 어떻게 굴러가는지부터 봅니다.
**이번 회차에 따라갈 질문: 내 tx는 누구를 거쳐 모두의 진실이 될까?**

## 방학 로드맵 — 트랜잭션 생애주기
:라벨 강의 6회 + 과제

:::cards
### 1회 (7/23) · 오늘
네트워크 큰 그림
### 2회 (7/30)
입구: RPC와 txpool
### 3회 (8/6)
심장: EVM
### 4회 (8/13)
결과: 상태와 트라이
### 5회 (8/20)
포장: 블록 생성
### 6회 (8/27)
전파: p2p와 4844
### 과제
정리와 수확 (글쓰기)
:::

## 상태 머신이란?
:라벨 복습

:::cards
### 상태
모든 계정의 스냅샷 하나
### 트랜잭션
상태를 바꾸는 유일한 수단
### 블록
tx 묶음 + 순서의 합의
:::

:::flow
### 상태 N
A: 5 ETH
B: 1 ETH
### 블록 N+1 실행
A→B 2 ETH
### 상태 N+1
A: 3 ETH
B: 3 ETH
:::

:::callout
제네시스(2015)부터 지금까지 이 반복뿐이고, **검증한다는 것은 처음부터 전부 재실행해 같은 상태에 도달하는지 확인한다는 뜻**이다. 이 상태 전이를 실제로 누가, 어떻게 굴리는지가 오늘 내용입니다.
:::

## 이더리움 네트워크란?
:라벨 개념 ①

중앙 서버 없음, 모두가 대등한 피어(p2p).

:::cards
### 같은 규칙
클라이언트는 제각각이다 (geth, Reth, Nethermind …). 전부 같은 규칙을 코드로 구현한 것들이다
### 같은 상태 사본
모든 풀노드가 상태 전체를 각자 보관한다. 누구의 것도 아니고 모두의 것
### 같은 입력, 같은 규칙 → 같은 결과
이 결정론이 탈중앙화의 작동 원리. 서로 믿지 않아도 같은 답에 도달한다
:::

## 노드는 무슨 일을 할까?
:라벨 개념 ②

:::cards
### 1. 검증
전파된 모든 블록의 모든 tx를 자기 EVM으로 직접 재실행해 결과를 대조한다. Don't trust, verify의 실체 — 3~4회차
### 2. 서빙 (RPC)
지갑·디앱의 창구. MetaMask의 요청은 결국 어느 노드가 받는다. Infura/Alchemy의 정체 = 거대한 노드 팜 — 2회차
### 3. 전파 (p2p)
tx와 블록을 이웃 노드에 릴레이한다. 노드가 많을수록 그물이 촘촘하고 검열이 어렵다 — 6회차
:::

:::callout
셋 다 예치금이나 허가 없이 노트북만으로 가능하다. 이번 주 과제에서 직접 해본다.
:::

## 검증자란?
:라벨 개념 ③

:::compare
### 일반 노드 (풀노드)
- 누구나, 예치금 없이, 허가 없이
- 검증, 서빙, 전파 전부 수행
- 보상은 없지만 아무도 못 속인다
- 네트워크 노드의 대다수가 이쪽
### 검증자 = 노드 + 32 ETH + 검증자 키
- 블록 제안과 증명(attest)은 검증자만
- 일하면 보상, 부정행위엔 슬래싱 (예치금 몰수)
- CL 쪽에 검증자 클라이언트를 추가로 붙인다
- 하드웨어는 일반 노드와 사실상 동일
:::

:::callout
검증자를 정직하게 만드는 것은 검증자가 아닌 노드들이다. 모두가 재실행해서 대조하기 때문에, 틀린 블록은 제안해봤자 버려진다.
:::

## 합의란?
:라벨 개념 ④

수천 개의 노드가 있는데, 다음 블록은 누가 쓸까? 순서를 정하는 절차가 합의이고, 이더리움은 지분증명(PoS)을 쓴다.

:::flow
### 12초
슬롯 하나. 이더리움의 심장 박동
### 1명
슬롯마다 검증자 중 무작위 1명이 블록 제안자로 선출
### 수십만
나머지 검증자들이 '이 블록 봤고 유효하다'고 증명(attest)
### 슬래싱
이중 제안 등 부정행위엔 예치금 몰수, 정직이 수지맞게 설계
:::

## 직접 굴려보기 — 이더리움 풀 사이클
:라벨 인터랙티브

방금 배운 것을 직접 눌러보세요. ① 스테이킹으로 검증자를 만들고 ② tx를 흘려보내고 ③ 이중 제안이 어떻게 적발되는지까지. 드래그로 회전, 휠로 확대됩니다.

:::embed
/lecture/eth-full-cycle/raw
:::

## 노드 안에는 뭐가 있을까?
:라벨 구조 ①

내 노드(컴퓨터 한 대) 안에서 두 프로그램이 협업한다. 사이는 **Engine API**로 연결된다(5주차).

:::compare
### 합의 클라이언트 (CL)
Lighthouse, Prysm …
방금 본 PoS(슬롯·제안·증명)를 담당
### 실행 클라이언트 (EL) = geth
tx를 실행하고, 상태를 보관하고, 블록을 검증한다
**6회 동안 알아볼 것이 바로 이 상자**
:::

:::cards
### 분업 구조
2022년 머지 이후 노드는 두 프로그램의 협업이다. 합의(CL)와 실행(EL)이 분리되어 있다
### geth의 일
이 tx를 실행하면 상태가 어떻게 바뀔지를 계산하는 쪽. 합의는 하지 않는다
### 검증자라면
여기에 검증자 클라이언트가 하나 더 붙는다. 노드의 뼈대는 동일
:::

## geth 내부는 어떻게 생겼을까?
:라벨 구조 ②

지갑이 서명된 tx를 보내면, geth 안에서 이 길을 지난다. 위에는 CL이 Engine API로 "블록 만들어줘"를 내린다.

:::flow
### RPC — 2주
요청 접수 창구
### txpool — 2주
대기실, 검증
### 블록 조립 — 5주
miner, tx 선별
### EVM 실행 — 3주
옵코드 하나씩
### 상태 저장 — 4주
StateDB→트라이→디스크
:::

:::callout
**p2p (6주)** — 다른 노드들과 tx·블록을 주고받는 통로. txpool로 tx가 들어오고, 완성된 블록이 퍼져나간다.
:::

:::callout
**이 지도 한 장이 6회 커리큘럼 전체다.** 매주 한 칸씩 확대해서 들어가고, 매 세션 시작에 이 그림으로 돌아와 현재 위치를 짚는다.
:::

## 트랜잭션 생애주기
:라벨 정리

:::steps
### 지갑이 서명
개인키로 상태 변경 요청서에 서명. 아직 아무 일도 안 일어남
### 어느 노드의 RPC가 접수 — 2주
내 지갑이 연결된 노드(직접 띄운 것이든 Infura든)가 tx를 받는다
### txpool 대기 + 전파 — 2·6주
검증 통과한 tx가 대기실에 들어가고, p2p로 전 세계 노드에 퍼진다
### 제안자가 블록에 포함 — 5주
그 슬롯의 검증자가 txpool에서 tx를 골라 블록을 조립한다
### 모든 노드가 재실행 — 3주
블록이 전파되면 각 노드가 EVM으로 직접 실행해 결과를 대조한다
### 상태 확정 — 4주
모두가 같은 새 상태에 도달. 내 tx가 모두의 진실이 되는 순간
:::

:::callout
2번부터 6번까지 전부 **geth(EL) 코드 안에서** 일어난다. 그래서 우리는 geth를 읽는다.
:::

단계를 하나씩 넘기며 tx가 지나는 길을 따라가 보세요.

:::embed
/lecture/tx-lifecycle/raw
:::

## 왜 geth일까?
:라벨 정리

:::compare
### 왜 geth인가
- 가장 오래되고 가장 많이 쓰이는 EL 구현, 사실상의 표준 교과서
- 이더리움의 진짜 스펙은 문서가 아니라 돌아가는 코드다
- 규칙이 어떻게 소프트웨어가 되는지를 볼 수 있는 최고의 창
### 왜 Go인가
- 단일 바이너리, make geth 한 번이면 전 세계 누구나 노드를 띄운다
- 고루틴 동시성, 수백 피어와 RPC를 동시에 다루는 노드에 딱 맞는 도구
- 단순한 문법, 읽는 데 필요한 건 4개뿐
:::

## 과제 ① — geth 빌드와 실행
:라벨 과제 · 다음 주 목요일까지

**0) 준비물 확인** — Go 1.23 이상과 git이 필요합니다.

```bash
go version      # go1.23 이상이어야 한다
git --version
```

Go가 없거나 버전이 낮으면 — macOS는 `brew install go`, 그 외는 go.dev/dl 에서 설치하세요.

**1) 소스 받아서 빌드** — 컴퓨터에 따라 몇 분 걸립니다.

```bash
git clone https://github.com/ethereum/go-ethereum
cd go-ethereum
make geth
```

빌드가 끝나면 실행 파일이 생겼는지 확인합니다.

```bash
./build/bin/geth version    # 버전 정보가 출력되면 성공
```

**2) dev 모드로 로컬 체인 실행** — 이 터미널은 **켜둔 채로** 둡니다.

```bash
./build/bin/geth --dev --datadir ./devchain \
  --http --http.api eth,web3,net,txpool --verbosity 4
```

`--datadir ./devchain`을 주는 이유: 이 옵션을 빼면 geth가 임시 폴더에 체인을 만들어서, 다음 단계에서 접속할 경로를 찾기 번거롭습니다. 경로를 고정해두면 편합니다.

실행되면 로그에서 이 줄들을 찾아보세요.

:::cards
### Starting Geth in ephemeral dev mode
dev 모드로 떴다는 뜻
### Using developer account address=0x…
잔액이 잔뜩 든 계정이 자동으로 만들어졌다
### IPC endpoint opened url=…/devchain/geth.ipc
3단계에서 접속할 주소
### HTTP server started endpoint=127.0.0.1:8545
지갑·디앱이 붙는 RPC 창구 (2회차에서 볼 그 입구)
:::

:::callout
**dev 모드란?** 머지 이후 일반 geth는 CL이 있어야 블록을 만든다. 하지만 `--dev`는 geth가 CL을 흉내 내는 코드를 내장하고 있어서 혼자 즉시 블록을 만들고, 잔액이 든 계정도 준다. 메인넷 동기화 없이 오늘 배운 흐름을 그대로 볼 수 있는 실험실이다.
:::

## 과제 ② — 로컬에서 tx 보내보기
:라벨 과제 · 다음 주 목요일까지

**3) 콘솔 접속** — geth를 띄운 터미널은 그대로 두고, **새 터미널**을 엽니다.

```bash
cd go-ethereum
./build/bin/geth attach ./devchain/geth.ipc
```

`>` 프롬프트가 뜨면 성공입니다. 여기부터는 자바스크립트 콘솔입니다.

**4) 계정과 잔액 확인**

```javascript
eth.accounts                                              // 개발자 계정 하나가 보인다
web3.fromWei(eth.getBalance(eth.accounts[0]), "ether")    // 잔액 (엄청 큼)
eth.blockNumber                                           // 현재 블록 높이
```

**5) tx 보내기** — 아무 주소로 1 ETH를 보냅니다.

```javascript
var to = "0x000000000000000000000000000000000000dEaD";
var txHash = eth.sendTransaction({
  from: eth.accounts[0],
  to: to,
  value: web3.toWei(1, "ether")
});
txHash      // 0x… 이 해시를 복사해두세요
```

**6) 결과 확인** — dev 모드는 tx가 들어오면 즉시 블록을 만들기 때문에 바로 확인됩니다.

```javascript
eth.getTransaction(txHash)         // blockNumber가 채워져 있으면 블록에 담긴 것
eth.getTransactionReceipt(txHash)  // status가 "0x1"이면 성공
eth.blockNumber                    // 1 늘어나 있다
web3.fromWei(eth.getBalance(to), "ether")   // 받은 주소 잔액이 1
```

**7) 서버 로그에서 tx 해시 추적** — geth를 띄워둔 터미널로 돌아가, 5단계에서 복사한 해시를 찾아보세요. 대략 이런 줄들이 보입니다 (geth 버전에 따라 문구는 조금 다를 수 있습니다).

:::steps
### Submitted transaction hash=0x…
내 tx가 RPC로 접수되어 txpool에 들어간 순간 — 2회차
### Commit new sealing work · Successfully sealed new block txs=1
제안자가 멤풀에서 tx를 골라 블록을 조립한 순간 — 5회차
### Imported new chain segment (블록이 체인에 붙는 줄)
블록이 실행·검증되고 상태가 확정된 순간 — 3·4회차
:::

각 로그 줄이 오늘 본 파이프라인의 어느 칸인지 메모해보세요. 완벽하지 않아도 됩니다.

**끝낼 때** — geth 터미널에서 `Ctrl + C`. 체인을 완전히 지우려면 `rm -rf devchain`.

## 막혔을 때
:라벨 트러블슈팅

:::cards
### make: command not found
macOS는 `xcode-select --install`로 명령줄 도구를 먼저 설치
### go 버전이 낮다고 나올 때
`brew upgrade go` 또는 go.dev/dl 에서 최신 설치 후 `go version` 재확인
### address already in use
8545 포트를 이미 쓰는 geth가 떠 있다. 그 터미널에서 Ctrl+C로 끄고 다시 실행
### attach 시 no such file
geth가 실행 중인지, `./devchain/geth.ipc` 경로가 맞는지 확인. 2단계에서 `--datadir`를 줬는지도 확인
### insufficient funds · unknown account
`from`에 `eth.accounts[0]`을 썼는지 확인. dev 모드 계정은 자동으로 잠금 해제되어 있다
:::

:::callout
**제출 = 복습 퀴즈 풀기.** 이 사이트의 이더리움 코어 트랙에서 지갑 로그인 후 제출하세요. tx 보내보기는 권장 실습(제출 없음, 해보면 이해가 쉬움).
:::

## --dev는 진짜 PoS가 아니다
:라벨 백업

과제에서 혼자 블록이 만들어지는 건 PoW도 PoS도 아니다. geth가 CL을 흉내 내는 코드를 내장하고 있어서다.

:::compare
### 실제 메인넷
진짜 CL (Prysm, Lighthouse) ↔ Engine API ↔ EL (geth)
### --dev 모드 (한 프로세스 안)
가짜 CL (SimulatedBeacon) ↔ EL (geth)
:::

:::cards
### 하는 일
멤풀에 tx가 있으면 Engine API로 geth에 블록을 만들라고 명령한다. 그게 전부다
### 없는 것
검증자도 스테이킹도 투표도 없다. tx가 들어오면 바로 블록을 만드는 개발용 스위치일 뿐이다
### 진짜 PoS
제안자 선출이나 투표 집계 같은 합의는 이 저장소가 아니라 CL에 있다. 로컬에서 제대로 돌리려면 Prysm 같은 CL을 따로 붙여야 한다
:::

:::callout
코드 위치: `eth/catalyst/simulated_beacon.go`
:::

## 다음 주 예고 — 2회차: RPC와 txpool

과제로 보낸 tx가 geth의 어디로 들어와 어떤 검사를 거치는지 코드로 직접 따라갑니다.

- `eth_sendRawTransaction`의 착지 지점, Tour로 훑은 Go를 실전에서
- 멤풀 입장 검사: 서명 복원, nonce 검증, 잔액 확인
- 같은 nonce tx의 교체 규칙 (가스 입찰)

