# 02단계 — ChatGPT에 붙여넣을 내용

## 함께 첨부할 파일 (5개)

| # | 파일 | 위치 |
|---|---|---|
| 1 | `weeklypick-project.md` | `weeklypick/weeklypick-project.md` |
| 2 | `weeklypick-design-rull.md` | `weeklypick/weeklypick-design-rull.md` |
| 3 | `beginner-student.md` | `~/Downloads/beginner-md-all모음 (1)/beginner-student.md` |
| 4 | `01-v1-feedback.md` | `v2/01-v1-feedback.md` |
| 5 | `weeklypick-v1-source.zip` | `v2/weeklypick-v1-source.zip` |

---

## 붙여넣을 프롬프트

나는 Beginner 과정에서 첫 번째 모바일 웹 MVP를 완성했고,
이제 기존 결과물을 V2로 다시 디벨롭하고 고도화하려고 합니다.

먼저 코드를 수정하거나 새로운 디자인을 만들지 말고
현재 결과물을 나와 함께 검토해 주세요.

서비스는 "위클리픽"입니다.
이번 주말 갈 수 있는 서울의 전시·팝업만 골라
"왜 볼 만한지" 한 줄과 관람 팁을 붙여
매주 목요일 발행하는 큐레이션 매거진 모바일웹입니다.

현재 배포 URL: https://weekly-pick.vercel.app
(모바일 크기로 보세요. 430px 기준으로 만들었습니다.)

내가 제공하는 자료는 다음과 같습니다.

1. 현재 배포 URL (위 링크)
2. weeklypick-project.md — 화면상세 명세 (beginner-project.md 대응)
3. weeklypick-design-rull.md — 디자인 규정 (beginner-design-rull.md 대응)
4. beginner-student.md — 과정 실행 지시서
5. 01-v1-feedback.md — 제작 중 받은 피드백과 직접 써보며 느낀 아쉬운 점
6. weeklypick-v1-source.zip — 현재 소스코드

다음 기준으로 현재 결과물을 분석해 주세요.

- 처음 방문한 사용자가 서비스 목적을 이해할 수 있는가
- 핵심 기능까지 이동하는 흐름이 자연스러운가
- 불필요한 단계나 중복된 화면이 있는가
- 필요한 화면이나 상태가 빠져 있지는 않은가
- 정보의 우선순위가 적절한가
- 기능과 화면이 실제 사용자 문제 해결에 연결되어 있는가
- UI 위계와 일관성에 문제가 없는가
- Empty, Loading, Error, 완료 상태 등 필요한 상태가 빠져 있지 않은가
- V2에서 추가할 가치가 있는 기능은 무엇인가
- 구현 난이도에 비해 개선 효과가 낮은 기능은 무엇인가

분석한 뒤 바로 최종안을 결정하지 말고
나와 하나씩 의논하면서 V2 범위를 정해 주세요.

최종적으로 다음 네 가지로 정리해 주세요.

1. 유지할 것
2. 수정할 것
3. 추가할 것
4. 이번 V2에서 제외할 것

선택된 개선사항은 반드시

현재 문제
→ 왜 문제인지
→ 개선 방향
→ 적용 화면
→ 우선순위

순서로 정리해 주세요.

그리고 마지막에는 다음 단계에서 Codex에게 그대로 전달할 수 있는
V1 Figma 이전 및 추가 Wireframe 제작 프롬프트를 작성해 주세요.
