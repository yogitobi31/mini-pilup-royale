# Stability Mode Regression Checklist

이 프로젝트는 **신규 기능 추가보다 기존 게임 루프 안정성 유지가 우선**입니다.
아래 항목 중 하나라도 깨지면 릴리즈를 중단하고 원인부터 복구합니다.

## Core gameplay invariants (must keep)

- AI 타깃 선택은 `local player` 편향이 없어야 한다.
  - 모든 AI는 살아있는 다른 전투원을 동등하게 적으로 간주한다.
  - `player-follow only` 구조로 변경 금지.
- 기본 이동속도는 `BASE_MOVE_SPEED` 기준으로 통일한다.
  - 버프/디버프/스킬 효과가 아닌 기본값 차등 금지.
- 플레이어는 전투원 집합의 일부이며, 전투 규칙은 AI와 동일한 전장 규칙을 공유한다.

## Required regression tests

- [ ] 모바일에서 플레이어 캐릭터가 조이스틱으로 움직인다.
- [ ] PC에서 WASD/방향키 이동이 된다.
- [ ] AI 캐릭터들은 플레이어만 따라오지 않고, 서로 탐색/추적/공격한다.
- [ ] AI와 플레이어의 기본 이동속도는 같다.
- [ ] 자기장은 내부가 보일 정도로 투명해야 한다.
- [ ] 캐릭터가 장애물이나 지형에 끼었을 때 빠져나올 수 있어야 한다.
- [ ] 다중 접속에서 각 플레이어가 독립적으로 보인다.
- [ ] 한 명의 입력이 다른 플레이어 캐릭터를 움직이면 안 된다.
- [ ] 모바일 화면에서 브라우저 웹페이지 느낌이 최소화되어야 한다.
- [ ] UI 버튼은 게임 화면을 과도하게 가리지 않아야 한다.

## Triage priority for regressions

1. AI target selection
2. Movement speed parity
3. Collision / stuck handling
4. Safe-zone rendering/visibility
5. Multiplayer player ownership/input isolation

