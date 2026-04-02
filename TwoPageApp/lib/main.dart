import 'package:flutter/material.dart';

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
/// 나중에 두 번째 화면으로 이동하려면 [ListTile.onTap] 안에서
/// `Navigator.push` 등을 호출하면 됩니다.
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
                    // 나중에 클릭(탭) 처리를 여기에 연결합니다.
                    // 예: Navigator.push(...), 또는 콜백을 부모에서 내려받기
                    onTap: () {
                      // TODO: 두 번째 화면으로 이동하거나 상세 동작을 연결
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
