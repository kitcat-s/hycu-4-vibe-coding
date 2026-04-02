import 'package:flutter/material.dart';

/// 두 번째 화면(상세): 첫 화면에서 선택한 항목 이름을 크게 표시합니다.
///
/// **파일 분리 이유**
/// - 화면마다 클래스가 길어지면 [main.dart]가 비대해져 읽기 어렵습니다.
/// - `lib/screens/` 아래에 화면별 파일을 두면 찾기 쉽고, 나중에
///   [GoRouter] 등으로 라우트만 바꿀 때도 수정 범위가 명확합니다.
///
/// **다음 단계에서 할 일(참고)**
/// - 첫 화면의 [ListTile.onTap]에서 아래처럼 화면을 띄우고 문자열을 넘깁니다.
///   ```dart
///   Navigator.of(context).push(
///     MaterialPageRoute<void>(
///       builder: (BuildContext context) =>
///           PageTwoScreen(itemName: label),
///     ),
///   );
///   ```
class PageTwoScreen extends StatelessWidget {
  const PageTwoScreen({
    super.key,
    required this.itemName,
  });

  /// 첫 화면에서 넘겨받을 항목 이름입니다.
  /// 다음 단계에서 [Navigator.push]의 인자로 연결하면 됩니다.
  final String itemName;

  @override
  Widget build(BuildContext context) {
    final TextTheme textTheme = Theme.of(context).textTheme;

    return Scaffold(
      // 상단 바: 뒤로가기 + 화면 제목 (스케치의 "Page Two" 영역)
      appBar: AppBar(
        // Material 3에서는 [leading]을 생략해도 스택에 이전 화면이 있으면
        // 뒤로가기 버튼이 자동으로 나올 수 있습니다. 스케치처럼 명시적으로
        // 제어하려면 아래 [IconButton]을 유지합니다.
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          tooltip: '이전 화면',
          onPressed: () {
            // 현재 라우트를 스택에서 제거해 첫 화면으로 돌아갑니다.
            Navigator.of(context).pop();
          },
        ),
        title: const Text('Page Two'),
      ),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            // 세로로 제목(고정) + 중앙 큰 글자를 쌓습니다.
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // 항목 이름을 화면 중앙 부근에 크게 표시합니다.
                // 나중에 서버/상태에서 받은 문자열을 그대로 넣으면 됩니다.
                Text(
                  itemName,
                  textAlign: TextAlign.center,
                  style: textTheme.headlineLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                // 상세 본문(설명 문단 등)은 다음 단계에서 [itemName] 아래에
                // [Text]나 [SelectableText] 등으로 추가하면 됩니다.
              ],
            ),
          ),
        ),
      ),
    );
  }
}
