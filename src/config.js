// config.js — 제품화 설정 (한 곳에서 관리)
// 결제는 아직 연동하지 않고 "가격표 + 웨이트리스트"만 운영한다.

export const PRODUCT = {
  name: "프롬프트 나무",
  handle: "@prompttree", // 공유 카드 푸터에 박히는 핸들 (원하는 값으로 교체)
  url: "prompt-tree.app", // 배포 도메인 (공유 카드 푸터/메타용, 실제 배포 후 교체)
};

// Pro(브라우저 확장) 웨이트리스트.
// 외부 폼(Tally/Google Form 등)을 쓰려면 URL을 넣어라.
// 비워두면 이메일을 localStorage 에만 모아두고(외부 전송 없음) 감사 메시지를 띄운다.
export const WAITLIST_URL = "";

// Pro 가격(웨이트리스트 단계의 표시용. 실제 청구 아님)
export const PRO_PRICE = "$4 / 월";
