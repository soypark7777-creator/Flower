from weasyprint import HTML

# Define the Markdown content as HTML for PDF conversion
html_content = """
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            size: A4;
            margin: 20mm;
            background-color: #fcfdfd;
        }
        body {
            font-family: 'Nanum Gothic', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .header {
            background-color: #4a7c59;
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            margin-bottom: 20px;
        }
        h1 { margin: 0; font-size: 22pt; }
        h2 { color: #2d5a27; border-left: 5px solid #4a7c59; padding-left: 10px; margin-top: 30px; font-size: 16pt; }
        h3 { color: #3e6d3a; font-size: 13pt; margin-top: 20px; }
        code { background-color: #e8f5e9; padding: 2px 4px; border-radius: 4px; font-family: monospace; }
        pre { background-color: #f1f8e9; padding: 15px; border-radius: 8px; border: 1px solid #c8e6c9; overflow-x: auto; }
        .role-box {
            display: block;
            background-color: #ffffff;
            border: 1px solid #ddd;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 8px;
        }
        .highlight { color: #d32f2f; font-weight: bold; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌸 Petal Portal 개발 지침서</h1>
        <p>VS Code (Backend) & Claude Code (Frontend) 협업 가이드</p>
    </div>

    <section>
        <h2>1. 프로젝트 개요</h2>
        <p>본 프로젝트는 사용자가 실시간으로 꽃을 탐지하고, 촬영된 사진을 통해 맞춤형 꽃말 정보와 인테리어 가이드를 제공받는 웹 서비스입니다.</p>
    </section>

    <section>
        <h2>2. 역할 분담 (Role Definition)</h2>
        
        <div class="role-box">
            <h3>🖥️ Backend (VS Code + Codex/Copilot)</h3>
            <ul>
                <li><strong>핵심 기술:</strong> Next.js API Routes, Google Gemini API, Node.js</li>
                <li><strong>임무:</strong>
                    <ul>
                        <li>이미지 분석을 위한 Gemini 1.5 Pro API 연동 모듈 개발</li>
                        <li>꽃 정보 및 인테리어 추천 프롬프트 엔지니어링</li>
                        <li>데이터 파싱 및 프런트엔드용 JSON API 설계</li>
                    </ul>
                </li>
            </ul>
        </div>

        <div class="role-box">
            <h3>🎨 Frontend (Claude Code)</h3>
            <ul>
                <li><strong>핵심 기술:</strong> React, Tailwind CSS, Lucide Icons, TensorFlow.js</li>
                <li><strong>임무:</strong>
                    <ul>
                        <li>실시간 카메라 스트리밍 인터페이스 및 꽃 감지 UI 레이어</li>
                        <li>감성적인 매거진 스타일의 인테리어 가이드 결과 페이지</li>
                        <li>백엔드 API 호출 및 상태 관리 (로딩 애니메이션 등)</li>
                    </ul>
                </li>
            </ul>
        </div>
    </section>

    <section>
        <h2>3. 초기 실행 지침 (Step-by-Step)</h2>
        
        <h3>Step 1: 공통 환경 설정</h3>
        <p>먼저 Next.js 프로젝트를 생성하고 기본 구조를 잡습니다.</p>
        <pre>npx create-next-app@latest petal-portal --typescript --tailwind --eslint</pre>

        <h3>Step 2: 프런트엔드 시작 (Claude Code용 지시어)</h3>
        <p>Claude Code 터미널에서 다음 명령을 입력하여 작업을 시작하세요.</p>
        <pre>claude "실시간 카메라 화면을 보여주는 /explore 페이지를 만들어줘. TensorFlow.js를 사용해서 화면 중앙에 꽃이 감지되면 '꽃을 찾았습니다!'라는 메시지가 뜨게 해줘. 디자인은 최대한 깔끔하고 감성적인 느낌으로 해줘."</pre>

        <h3>Step 3: 백엔드 시작 (VS Code Codex/Copilot용 지시어)</h3>
        <p><code>/pages/api/analyze.ts</code> 파일을 생성하고 Copilot에게 다음과 같이 요청하세요.</p>
        <pre>// Google Gemini API를 사용하여 이미지를 분석하고 
// { flowerName, language, interiorTips: [] } 형태의 
// JSON을 반환하는 API 엔드포인트를 작성해줘.</pre>
    </section>

    <section>
        <h2>4. 데이터 규격 (Contract)</h2>
        <p>프런트엔드와 백엔드는 다음 데이터를 주고받기로 약속합니다.</p>
        <pre>
{
  "name": "작약",
  "flower_language": "수줍음, 부끄러움",
  "interior_guide": {
    "style": "Minimalistic & Warm",
    "placement": "밝은 나무 재질의 침대 옆 협탁",
    "mood_color": "#FADADD (Pale Pink)"
  }
}
        </pre>
    </section>

    <section>
        <h2>5. 주의 사항</h2>
        <ul>
            <li><span class="highlight">환경 변수:</span> Gemini API 키는 <code>.env.local</code>에 보관하고 절대 깃허브에 올리지 마세요.</li>
            <li><span class="highlight">브라우저 권한:</span> 카메라 접근을 위해 HTTPS 또는 localhost 환경에서 테스트해야 합니다.</li>
            <li><span class="highlight">반응형 디자인:</span> 사용자가 야외에서 꽃을 비출 수 있도록 모바일 뷰에 최적화하세요.</li>
        </ul>
    </section>
</body>
</html>
"""

# Generate the PDF
with open("project_guide.html", "w", encoding="utf-8") as f:
    f.write(html_content)

HTML(string=html_content).write_pdf("PetalPortal_Project_Guide.pdf")