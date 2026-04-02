import 'package:flutter/material.dart';
import 'package:two_page_app/screens/page_two_screen.dart';

void main() {
  runApp(const MyApp());
}

/// 앱 진입점에서 사용하는 최상위 위젯입니다.
/// [MaterialApp]으로 테마와 홈 화면을 지정합니다.
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Two Page App',
      // 스케치처럼 밝은 배경을 쓰려면 시드 색을 밝게 두거나
      // scaffoldBackgroundColor를 흰색에 가깝게 맞출 수 있습니다.
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blueGrey),
        scaffoldBackgroundColor: Colors.white,
        useMaterial3: true,
      ),
      home: const PageOneScreen(),
    );
  }
}

/// 첫 번째 화면: 제목 + 텍스트 목록 (스케치의 "Page One").
///
/// **이 파일에서 이번에 손댄 부분**
/// 1. 상단 `import` — [PageTwoScreen]을 쓰기 위해 패키지 경로로 가져옵니다.
/// 2. [ListView.separated]의 [ListTile.onTap] — 탭 시 상세 화면으로 이동합니다.
///
/// ---
/// **네비게이션 스택(Navigation Stack)이란?**
/// Flutter는 화면 전환을 “책을 쌓듯” 쌓아 둡니다. 맨 아래가 첫 화면,
/// 그 위에 두 번째 화면이 올라갑니다.
/// - [Navigator.push]: 새 [Route]를 **스택 위에 올려** 다음 화면을 보여 줍니다.
/// - [Navigator.pop] (상세 화면 뒤로가기): 맨 위 Route를 **꺼내서** 이전 화면으로
///   돌아갑니다. 스택 깊이가 1 줄어듭니다.
///
/// **데이터 전달(표준적인 방법)**
/// 다음 화면 위젯의 **생성자 매개변수**로 값을 넘깁니다.
/// `PageTwoScreen(itemName: label)`처럼 호출하면, 상세 화면 클래스의
/// `final String itemName` 필드에 그대로 들어가 [build]에서 [Text] 등에 쓸 수
/// 있습니다. (간단한 문자열·모델 1개에는 이 방식이 가장 흔합니다.)
class PageOneScreen extends StatelessWidget {
  const PageOneScreen({super.key});

  /// 목록에 표시할 라벨입니다. 필요하면 여기만 수정해 항목을 늘리거나 바꿉니다.
  static const List<String> _itemLabels = [
    'Item A',
    'Item B',
    'Item C',
    'Item D',
  ];

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      // AppBar 없이 본문만 쓰는 예시입니다. 상단 여백은 [SafeArea]로 조정합니다.
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 화면 상단 큰 제목 (스케치의 "Page One")
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 16),
              child: Text(
                'Page One',
                style: textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            // 목록이 길어지면 스크롤되도록 남은 세로 공간을 ListView가 차지합니다.
            Expanded(
              child: ListView.separated(
                // physics: 스크롤 동작(바운스 등). 기본값으로 두면 충분합니다.
                itemCount: _itemLabels.length,
                // [separatorBuilder]로 항목 사이에만 구분선을 넣습니다.
                // 첫 줄 위·마지막 줄 아래에는 선이 없습니다.
                separatorBuilder: (BuildContext context, int index) {
                  return const Divider(
                    height: 1,
                    thickness: 1,
                  );
                },
                itemBuilder: (BuildContext context, int index) {
                  final String label = _itemLabels[index];
                  return ListTile(
                    title: Text(label),
                    // 오른쪽 화살표: 탭 가능한 행임을 시각적으로 표시합니다.
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () {
                      // [Navigator.of(context)]는 이 [BuildContext]가 속한
                      // [Navigator]를 찾습니다. [MaterialApp]이 제공합니다.
                      //
                      // [MaterialPageRoute]: 플랫폼에 맞는 전환 애니메이션으로
                      // 새 화면을 스택에 올립니다.
                      //
                      // [builder]가 반환하는 [PageTwoScreen]에 `label` 문자열을
                      // 생성자 인자 [itemName:]으로 넘깁니다 → 상세 화면에서 동일
                      // 문자열을 표시합니다.
                      Navigator.of(context).push<void>(
                        MaterialPageRoute<void>(
                          builder: (BuildContext context) =>
                              PageTwoScreen(itemName: label),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
