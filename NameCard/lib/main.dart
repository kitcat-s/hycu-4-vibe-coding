import 'package:flutter/material.dart';

void main() {
  // runApp: 플러터 앱의 진입점으로, 위젯 트리를 화면에 렌더링한다.
  runApp(const NameCardApp());
}

/// 디지털 명함 전체를 감싸는 루트 위젯
///
/// - StatelessWidget: 내부에 변경 가능한 상태가 없고, build 결과가
///   외부에서 주입된 값에만 의존하는 위젯을 만들 때 사용한다.
class NameCardApp extends StatelessWidget {
  const NameCardApp({super.key});

  @override
  Widget build(BuildContext context) {
    // MaterialApp: 머티리얼 디자인 기반 앱의 시작점.
    // 여기서 테마, 라우팅, 홈 화면 등을 설정한다.
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Digital Name Card',
      theme: ThemeData(
        // ColorScheme.fromSeed: 하나의 시드 색상으로 전체 색 구성표를 생성한다.
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blueGrey,
        ),
        useMaterial3: true,
      ),
      // home: 앱이 시작될 때 가장 먼저 보여줄 화면을 지정한다.
      home: const NameCardPage(),
    );
  }
}

/// 실제 디지털 명함 화면을 표현하는 위젯
class NameCardPage extends StatelessWidget {
  const NameCardPage({super.key});

  @override
  Widget build(BuildContext context) {
    // Scaffold: 기본 화면 구조(AppBar, body 등)를 제공하는 레이아웃 위젯.
    return Scaffold(
      // 화면 전체 배경색
      backgroundColor: Colors.grey.shade200,
      appBar: AppBar(
        // AppBar 배경을 투명하게 하고, 그림자를 제거해 심플한 상단 영역을 만든다.
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          'Digital Name Card',
        ),
      ),
      // body: 실제 명함 UI가 들어가는 영역
      body: Center(
        // SingleChildScrollView: 화면이 작을 때 내용이 잘리지 않도록
        // 스크롤이 가능하게 만드는 위젯.
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          // _NameCard 위젯이 실제 명함 카드를 그린다.
          child: const _NameCard(),
        ),
      ),
    );
  }
}

/// 명함 카드 전체를 감싸는 위젯
class _NameCard extends StatelessWidget {
  const _NameCard();

  @override
  Widget build(BuildContext context) {
    // LayoutBuilder: 부모의 크기(제약 조건)를 알 수 있는 레이아웃 위젯.
    // 반응형 UI를 만들 때 유용하다.
    return LayoutBuilder(
      builder: (context, constraints) {
        // maxWidth: 부모가 자식에게 허용하는 최대 가로 크기.
        // clamp: 최소 280, 최대 400 사이로 값을 제한한다.
        final cardWidth = constraints.maxWidth.clamp(280.0, 400.0);

        return Center(
          child: SizedBox(
            // SizedBox: 자식에게 고정된 크기(또는 최대 크기)를 부여한다.
            width: cardWidth,
            // Card: 둥근 모서리, 그림자가 있는 기본 카드 UI 위젯.
            child: Card(
              elevation: 2,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                // Padding: 자식 위젯 주위에 여백을 추가하는 위젯.
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 32,
                ),
                // Column: 위젯들을 세로 방향으로 나열하는 레이아웃 위젯.
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: const [
                    _ProfileHeader(),
                    SizedBox(height: 24),
                    _ContactSection(),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

/// 상단 프로필 영역 (프로필 사진 + 이름 + 직책)
class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader();

  @override
  Widget build(BuildContext context) {
    // Column: children 리스트에 전달된 위젯들을 위에서 아래로 배치한다.
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // CircleAvatar: 원형 프로필 이미지를 표현하는 위젯.
        // - backgroundImage에 AssetImage를 넣어 프로젝트 내 이미지(asset)를 사용한다.
        // - 아래 예시는 assets/images/profile.png 경로의 이미지를 사용한다고 가정한다.
        const CircleAvatar(
          radius: 40,
          backgroundColor: Colors.blueGrey,
          backgroundImage: AssetImage(
            'assets/images/profile.png',
          ),
        ),
        const SizedBox(height: 16),
        // Text: 이름 표시
        Text(
          'Jane Doe',
          // Theme.of(context).textTheme를 활용하면
          // 앱 전체에서 일관된 텍스트 스타일을 사용할 수 있다.
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        // Text: 직책 표시
        Text(
          'Software Engineer',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey.shade700,
              ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

/// 연락처(전화, 이메일, 웹사이트, 주소)를 한 덩어리로 모은 섹션 위젯
class _ContactSection extends StatelessWidget {
  const _ContactSection();

  @override
  Widget build(BuildContext context) {
    // Column: 여러 개의 연락처 행을 위에서 아래로 배치한다.
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: const [
        _ContactRow(
          icon: Icons.phone,
          label: '(123) 456-7890',
        ),
        SizedBox(height: 8),
        _ContactRow(
          icon: Icons.email,
          label: 'jane.doe@example.com',
        ),
        SizedBox(height: 8),
        _ContactRow(
          icon: Icons.public,
          label: 'www.example.com',
        ),
        SizedBox(height: 8),
        _ContactRow(
          icon: Icons.location_on,
          label: 'City, State',
        ),
      ],
    );
  }
}

/// 개별 연락처 행(아이콘 + 텍스트)을 표현하는 위젯
class _ContactRow extends StatelessWidget {
  const _ContactRow({
    required this.icon,
    required this.label,
  });

  /// 앞에 표시할 아이콘
  final IconData icon;

  /// 아이콘 오른쪽에 표시할 텍스트
  final String label;

  @override
  Widget build(BuildContext context) {
    // Row: 아이콘과 텍스트를 가로 방향으로 배치한다.
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Icon: 머티리얼 아이콘 표시.
        // size, color 등으로 스타일을 조정할 수 있다.
        Icon(
          icon,
          size: 18,
          color: Colors.grey.shade800,
        ),
        const SizedBox(width: 12),
        // Expanded: 남은 가로 공간을 모두 차지하도록 Text를 확장해
        // 줄바꿈이 자연스럽게 일어나도록 한다.
        Expanded(
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey.shade900,
                ),
          ),
        ),
      ],
    );
  }
}
