/* 위클리픽 데이터 — weeklypick-project.md 13장
   모든 전시·장소·후기는 가상의 샘플 콘텐츠다. */

// 13.1 기준일 상수 — 실제 시각을 읽지 않는다.
const TODAY = '2026-09-10';
const WEEKEND_SAT = '2026-09-12';
const WEEKEND_SUN = '2026-09-13';
const NEXT_ISSUE = '2026-09-17';
const ENDING_SOON_DAYS = 10;
const PLAN_LIMIT_MIN = 240;

const ISSUE = {
  id: 'vol-01',
  no: 'Vol.01',
  title: 'Vol.01 — 9월 둘째 주',
  publishedAt: TODAY,
  publishedLabel: '2026.09.10 발행',
  weekendLabel: '이번 주말 9.12 토 – 9.13 일',
  weekend: { sat: WEEKEND_SAT, sun: WEEKEND_SUN },
  nextIssueLabel: '2026.09.17 (목)',
  count: 10,
  isDelayed: false
};

const REGIONS = [
  {
    id: 'rg-jongno', name: '종로·북촌',
    lead: '골목 갤러리와 한옥',
    route: '안국역 2번 출구에서 계동길까지 걸어서 12분, 두 곳이 한 줄에 있어요.'
  },
  {
    id: 'rg-seongsu', name: '성수·건대',
    lead: '창고 팝업의 동네',
    route: '성수역 3번 출구 기준 세 곳이 도보 15분 안에 모여 있어요.'
  },
  {
    id: 'rg-hannam', name: '한남·용산',
    lead: '큰 전시와 빈티지',
    route: '한남 라이트홀에서 마켓홀까지 버스 두 정거장, 큰 전시부터 보는 게 편해요.'
  },
  {
    id: 'rg-hongdae', name: '홍대·연남',
    lead: '작은 서점과 사진',
    route: '홍대입구역 3번 출구에서 연남동 쪽으로 걸으며 두 곳을 묶어요.'
  }
];

const TAGS = ['미술', '사진', '디자인', '팝업', '체험'];

const EXHIBITIONS = [
  {
    id: 'ex-01',
    title: '빛의 방 — 미디어아트 기획전',
    venue: '한남 라이트홀',
    address: '서울 용산구 한남대로 00길 12',
    regionId: 'rg-hannam',
    start: '2026-08-20', end: '2026-10-04',
    price: 18000, booking: '권장', duration: 90,
    tags: ['미술', '체험'],
    pick: 1,
    image: 'assets/images/ex-01-light-room.webp',
    alt: '어두운 전시장 벽면에 빛 패턴이 흐르고 관람객 두 명이 서 있는 모습',
    editorLine: '사진보다 실물이 좋은 드문 경우',
    tips: [
      '평일 오전이 가장 한산해요',
      '마지막 방은 앉아서 5분 정도 보는 걸 추천해요',
      '사진은 플래시 없이 찍을 수 있어요'
    ]
  },
  {
    id: 'ex-02',
    title: '골목의 기록: 북촌 사진전',
    venue: '북촌 골목갤러리',
    address: '서울 종로구 계동길 00-3',
    regionId: 'rg-jongno',
    start: '2026-08-28', end: '2026-09-14',
    price: 0, booking: '불필요', duration: 40,
    tags: ['사진'],
    pick: 2,
    image: 'assets/images/ex-02-alley-photo.webp',
    alt: '한옥 갤러리 흰 벽에 흑백 사진이 나란히 걸린 전시장',
    editorLine: '무료인데 이번 주가 마지막 주예요',
    tips: [
      '한옥 마당을 지나 들어가요, 신발은 벗지 않아도 돼요',
      '40분이면 충분해서 다른 곳과 묶기 좋아요'
    ]
  },
  {
    id: 'ex-03',
    title: '성수 종이 공방 팝업',
    venue: '성수 페이퍼 스튜디오',
    address: '서울 성동구 연무장길 00',
    regionId: 'rg-seongsu',
    start: '2026-09-05', end: '2026-09-20',
    price: 0, booking: '불필요', duration: 30,
    tags: ['팝업', '디자인'],
    pick: 3,
    image: 'assets/images/ex-03-paper-popup.webp',
    alt: '붉은 벽돌 창고 천장에 종이 오브제가 매달린 팝업 공간',
    editorLine: '30분 컷이라 성수 팝업이랑 묶기 좋아요',
    tips: [
      '종이 굿즈는 오후 4시쯤 품절돼요',
      '작업대 체험은 대기 없이 바로 할 수 있어요'
    ]
  },
  {
    id: 'ex-04',
    title: '한지 등불 워크숍',
    venue: '계동 한지방',
    address: '서울 종로구 계동길 00-9',
    regionId: 'rg-jongno',
    start: '2026-09-12', end: '2026-09-13',
    price: 15000, booking: '필수', duration: 60,
    tags: ['체험'],
    pick: 0,
    image: 'assets/images/ex-04-hanji-lantern.webp',
    alt: '마루 위에 한지 등불 여러 개가 켜져 있는 워크숍 공간',
    editorLine: '주말 이틀만 열고, 예약이 필수예요',
    tips: [
      '예약은 하루 전까지만 받아요',
      '만든 등불은 가져갈 수 있어요',
      '재료비가 참가비에 포함돼 있어요'
    ]
  },
  {
    id: 'ex-05',
    title: '한남 빈티지 포스터 마켓',
    venue: '한남 마켓홀',
    address: '서울 용산구 이태원로 00',
    regionId: 'rg-hannam',
    start: '2026-09-12', end: '2026-09-14',
    price: 0, booking: '불필요', duration: 45,
    tags: ['디자인', '팝업'],
    pick: 0,
    image: 'assets/images/ex-05-vintage-poster.webp',
    alt: '벽 가득 붙은 빈티지 포스터와 이를 살펴보는 손',
    editorLine: '웨이팅 30분, 오전이 답입니다',
    tips: [
      '오전 11시 전에 가면 웨이팅이 없어요',
      '현금만 받는 부스가 있어요'
    ]
  },
  {
    id: 'ex-06',
    title: '연남 작은 책 박람회',
    venue: '연남 책방골목',
    address: '서울 마포구 연남로 00길 5',
    regionId: 'rg-hongdae',
    start: '2026-09-10', end: '2026-09-20',
    price: 0, booking: '불필요', duration: 60,
    tags: ['디자인'],
    pick: 0,
    image: 'assets/images/ex-06-small-book.webp',
    alt: '좁은 서점 안에 독립출판물이 진열된 책 박람회 현장',
    editorLine: '가방을 가볍게 들고 가는 게 좋습니다',
    tips: [
      '서점 골목 전체가 행사장이라 입구에서 지도를 먼저 받으세요',
      '독립출판물은 재입고가 없어요'
    ]
  },
  {
    id: 'ex-07',
    title: '흙과 손 — 도자 소품전',
    venue: '성수 흙터',
    address: '서울 성동구 성수이로 00',
    regionId: 'rg-seongsu',
    start: '2026-08-25', end: '2026-09-28',
    price: 5000, booking: '불필요', duration: 30,
    tags: ['미술'],
    pick: 0,
    image: 'assets/images/ex-07-ceramic.webp',
    alt: '콘크리트 선반 위에 도자 소품이 놓인 자연광 전시장',
    editorLine: '혼자 30분, 소리 없는 전시가 필요할 때',
    tips: [
      '조용해서 혼자 보기 좋아요',
      '도자 소품은 구매도 할 수 있어요'
    ]
  },
  {
    id: 'ex-08',
    title: '창밖 서울 — 사진 기획전',
    venue: '서교 창가갤러리',
    address: '서울 마포구 와우산로 00길 8',
    regionId: 'rg-hongdae',
    start: '2026-09-01', end: '2026-10-11',
    price: 8000, booking: '권장', duration: 50,
    tags: ['사진'],
    pick: 0,
    image: 'assets/images/ex-08-photo-window.webp',
    alt: '큰 유리창 옆에 사진 프린트가 걸린 갤러리',
    editorLine: '오후 3시 창가 빛까지 보면 완성됩니다',
    tips: [
      '오후 3시 이후 창가 빛이 가장 좋아요',
      '2층은 계단으로만 올라갈 수 있어요'
    ]
  },
  {
    id: 'ex-09',
    title: '소리의 방 — 사운드 설치',
    venue: '이태원 사운드룸',
    address: '서울 용산구 이태원로 00길 21',
    regionId: 'rg-hannam',
    start: '2026-08-15', end: '2026-09-07',
    price: 12000, booking: '권장', duration: 40,
    tags: ['미술', '체험'],
    pick: 0,
    image: 'assets/images/ex-09-sound.webp',
    alt: '어두운 방에서 천장 스피커 아래 앉아 있는 관람객',
    editorLine: '지난주로 끝났어요. 아카이브로 남깁니다',
    tips: [
      '끝난 전시예요. 후기만 남길 수 있어요',
      '앉아서 듣는 구간이 있었어요'
    ]
  },
  {
    id: 'ex-10',
    title: '실과 결 — 텍스타일 팝업',
    venue: '성수 텍스타일랩',
    address: '서울 성동구 아차산로 00길 3',
    regionId: 'rg-seongsu',
    start: '2026-09-08', end: '2026-09-27',
    price: 0, booking: '불필요', duration: 30,
    tags: ['디자인', '팝업'],
    pick: 0,
    image: 'assets/images/ex-10-textile.webp',
    alt: '직물 롤과 태피스트리가 걸린 밝은 팝업 공간',
    editorLine: '만져볼 수 있는 전시라 아이와 가도 됩니다',
    tips: [
      '직물 샘플을 직접 만져볼 수 있어요',
      '성수역에서 걸어서 8분이에요'
    ]
  }
];

const ARTICLES = [
  {
    id: 'art-01',
    title: '3만 원으로 채우는 토요일 — 한남·성수 동선',
    subtitle: '빛의 방에서 종이 공방까지, 걸어서 이어지는 세 곳',
    category: '이번 주 코스',
    heroExhibitionId: 'ex-01',
    stops: [
      { exhibitionId: 'ex-01', time: '11:00' },
      { exhibitionId: 'ex-05', time: '13:00' },
      { exhibitionId: 'ex-03', time: '14:30' }
    ],
    moves: ['버스와 도보로 25분', '도보 15분'],
    moveMinutes: 40,
    body: [
      '토요일 오전 열한 시. 한남 라이트홀은 문을 열자마자 어둡습니다. 빛의 방은 90분짜리 전시지만, 마지막 방에서 앉아 있다 보면 늘 시간을 넘깁니다. 그래서 이 코스는 첫 순서를 여기로 잡았습니다. 오전에 들어가면 사람이 적어 벽 앞에 오래 서 있어도 눈치가 보이지 않습니다.',
      '두 번째는 걸어서, 그리고 버스로 25분 거리의 한남 마켓홀입니다. 빈티지 포스터 마켓은 무료지만 오후가 되면 줄이 생깁니다. 한 시 전에 도착하면 테이블을 여유 있게 뒤적일 수 있습니다. 현금만 받는 부스가 섞여 있으니 만 원 정도는 챙겨 가는 편이 좋습니다.',
      '마지막은 성수입니다. 종이 공방 팝업은 30분이면 충분해서 하루의 끝에 붙이기 좋습니다. 굿즈는 오후 네 시쯤 품절되니, 사고 싶은 게 있다면 도착하자마자 고르세요.',
      '관람 시간만 더하면 2시간 45분, 이동을 더하면 3시간 25분입니다. 비용은 첫 전시의 18,000원이 전부입니다. 반나절이 조금 안 되는 분량이라 저녁 약속이 있어도 무리가 없습니다.'
    ]
  },
  {
    id: 'art-02',
    title: '0원으로 채우는 일요일 — 북촌·연남·성수',
    subtitle: '무료 전시만 골라 지하철로 잇는 하루',
    category: '이번 주 코스',
    heroExhibitionId: 'ex-06',
    stops: [
      { exhibitionId: 'ex-02', time: '11:00' },
      { exhibitionId: 'ex-06', time: '12:30' },
      { exhibitionId: 'ex-10', time: '14:30' }
    ],
    moves: ['지하철 25분', '지하철 30분'],
    moveMinutes: 55,
    body: [
      '입장료를 한 푼도 쓰지 않는 하루를 짜봤습니다. 세 곳 모두 무료고, 예약도 필요 없습니다. 대신 동네가 흩어져 있어 지하철을 두 번 탑니다.',
      '북촌 골목갤러리에서 시작합니다. 흑백 사진 연작이 걸린 한옥 전시장인데, 40분이면 다 봅니다. 이번 주가 마지막 주라 다음 호에는 실리지 않습니다.',
      '연남 책방골목의 작은 책 박람회가 두 번째입니다. 서점 골목 전체가 행사장이라 입구에서 지도를 먼저 받는 게 좋습니다. 여기서 한 시간을 잡았지만, 책을 좋아한다면 더 걸립니다.',
      '마지막은 성수 텍스타일랩입니다. 직물을 직접 만져볼 수 있는 팝업이라 손으로 확인하는 재미가 있습니다. 관람 2시간 10분, 이동 55분, 비용 0원입니다.'
    ]
  },
  {
    id: 'art-03',
    title: '2시간이면 충분 — 성수 도보 세 곳',
    subtitle: '예약 없이 바로 들어갈 수 있는 곳만',
    category: '이번 주 코스',
    heroExhibitionId: 'ex-03',
    stops: [
      { exhibitionId: 'ex-03', time: '11:00' },
      { exhibitionId: 'ex-10', time: '12:00' },
      { exhibitionId: 'ex-07', time: '13:00' }
    ],
    moves: ['도보 8분', '도보 12분'],
    moveMinutes: 20,
    body: [
      '오후 약속이 있는 날에 넣기 좋은 코스입니다. 세 곳 다 성수역 반경 안에 있고, 예약이 필요 없어 마음이 바뀌어도 부담이 없습니다.',
      '종이 공방 팝업에서 시작해 텍스타일랩으로 걸어갑니다. 두 곳 다 무료고 각각 30분이면 충분합니다. 만드는 걸 좋아한다면 종이 쪽에서 시간을 더 쓰게 됩니다.',
      '마지막은 흙과 손입니다. 5,000원짜리 도자 소품전인데 조용해서 혼자 가기 좋습니다. 마음에 드는 소품은 살 수도 있습니다.',
      '관람 1시간 30분, 이동 20분, 비용 5,000원. 오전에 시작하면 점심 전에 끝납니다.'
    ]
  }
];

const SAMPLE_REVIEWS = [
  { id: 'rv-01', exhibitionId: 'ex-02', rating: 5, text: '흑백인데 골목 냄새가 나요. 40분이면 충분', day: '토요일', waiting: false, order: 1 },
  { id: 'rv-02', exhibitionId: 'ex-01', rating: 4, text: '사진보다 실물. 마지막 방은 꼭 앉아서', day: '일요일', waiting: true, order: 2 },
  { id: 'rv-03', exhibitionId: 'ex-03', rating: 4, text: '작아서 금방인데 종이 냄새가 좋아요', day: '토요일', waiting: false, order: 3 },
  { id: 'rv-04', exhibitionId: 'ex-05', rating: 3, text: '오후엔 사람 많아요, 오전 추천', day: '토요일', waiting: true, order: 4 },
  { id: 'rv-05', exhibitionId: 'ex-06', rating: 5, text: '책 세 권 샀습니다. 지갑 조심', day: '일요일', waiting: false, order: 5 },
  { id: 'rv-06', exhibitionId: 'ex-07', rating: 4, text: '조용해서 혼자 가기 좋아요', day: '토요일', waiting: false, order: 6 }
];

const SEARCH_SUGGESTIONS = ['무료', '30분', '성수', '사진'];
