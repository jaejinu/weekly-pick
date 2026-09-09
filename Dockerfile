# 위클리픽 — 정적 모바일 웹 (빌드 단계 없음)
FROM nginx:1.27-alpine

LABEL org.opencontainers.image.title="weeklypick" \
      org.opencontainers.image.description="위클리픽 — 주간 전시·팝업 큐레이션 매거진 모바일웹"

# 기본 설정 대신 프로젝트 설정 사용
RUN rm -f /etc/nginx/conf.d/default.conf
COPY docker/nginx.conf /etc/nginx/conf.d/weeklypick.conf

# 앱 파일만 복사한다 (.dockerignore 로 문서·에셋 원본 제외)
WORKDIR /usr/share/nginx/html
COPY index.html ./
COPY css/ ./css/
COPY js/ ./js/
COPY assets/ ./assets/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
