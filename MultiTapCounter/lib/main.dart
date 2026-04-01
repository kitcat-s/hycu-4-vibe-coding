import 'package:flutter/material.dart';

void main() => runApp(const MyApp());

/// 앱의 루트 위젯입니다.
/// 학습 목적: `home`에 `MultiTapCounterScreen`을 연결하는 가장 단순한 형태입니다.
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'Multi Tab Counter',
        theme: ThemeData(
          useMaterial3: true,
          scaffoldBackgroundColor: Colors.white,
        ),
        home: const MultiTapCounterScreen(),
      );
}

/// 멀티 탭 카운터 기본 화면입니다.
///
/// 왜 StatefulWidget을 쓰나요?
/// - 탭별 카운트 값은 나중에 버튼 클릭으로 변경될 "상태" 데이터입니다.
/// - 상태가 바뀌면 화면도 함께 갱신되어야 하므로 StatefulWidget이 적합합니다.
class MultiTapCounterScreen extends StatefulWidget {
  const MultiTapCounterScreen({super.key});

  @override
  State<MultiTapCounterScreen> createState() => _MultiTapCounterScreenState();
}

class _MultiTapCounterScreenState extends State<MultiTapCounterScreen>
    with SingleTickerProviderStateMixin {
  /// Tab 1 카운터 상태입니다.
  ///
  /// `final`이 아닌 이유:
  /// - 버튼을 눌러 값이 계속 변해야 하므로, "재할당 가능한 상태"여야 합니다.
  int _tab1Count = 0;

  /// Tab 2 카운터 상태입니다. Tab 1과 완전히 독립적으로 동작합니다.
  int _tab2Count = 0;

  /// Tab 3 카운터 상태입니다. Tab 1/2와 완전히 독립적으로 동작합니다.
  int _tab3Count = 0;

  /// TabBar와 TabBarView를 동기화하는 컨트롤러입니다.
  /// 탭 개수가 3개이므로 length는 3입니다.
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 3,
      vsync: this,
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          elevation: 0,
          centerTitle: true,
          title: const Text(
            'Multi Tab Counter',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w700,
              color: Colors.black,
            ),
          ),
          bottom: TabBar(
            controller: _tabController,
            labelColor: Colors.black,
            unselectedLabelColor: Colors.black45,
            indicatorColor: Colors.black,
            tabs: const [
              Tab(text: 'Tab 1'),
              Tab(text: 'Tab 2'),
              Tab(text: 'Tab 3'),
            ],
          ),
        ),
        body: TabBarView(
          controller: _tabController,
          children: [
            _CounterTab(
              count: _tab1Count,
            ),
            _CounterTab(
              count: _tab2Count,
            ),
            _CounterTab(
              count: _tab3Count,
            ),
          ],
        ),
        // 버튼은 "하단에 항상 고정"되어야 하므로 bottomNavigationBar를 사용합니다.
        // (TabBarView 안에 넣으면 탭 내용과 같이 스크롤/레이아웃 영향을 받을 수 있습니다.)
        bottomNavigationBar: SafeArea(
          minimum: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          child: SizedBox(
            height: 56,
            child: FilledButton(
              onPressed: _handleIncreasePressed,
              child: const Text(
                'Increase',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ),
      );

  /// 하단의 `Increase` 버튼을 눌렀을 때 호출됩니다.
  void _handleIncreasePressed() {
    // 1) 현재 선택된 탭의 인덱스를 구합니다. (0, 1, 2)
    final int selectedTabIndex = _tabController.index;

    // 2) setState()는 "화면 업데이트 예약"을 위해 필수입니다.
    //
    // Flutter는 선언형 UI입니다.
    // - build()는 "현재 상태(state)"를 바탕으로 위젯 트리를 다시 그리는 함수입니다.
    // - 그런데 상태값(_tabCounts)을 변경만 하고 setState()를 호출하지 않으면,
    //   Flutter는 이 State가 변경되었다는 사실을 알 수 없습니다.
    //
    // 즉:
    // - (예) _tab1Count += 1;              // 메모리 값만 바뀜
    // - setState(...)                      // "다시 build()해!"라고 알려줌
    //
    // setState()가 호출되면 프레임워크는 다음 프레임에서
    // 이 위젯의 build()를 다시 실행하고, 그 결과 Text('$count')가
    // 최신 값으로 즉시 바뀌어 화면에 반영됩니다.
    setState(() {
      // 선택된 탭에 해당하는 "그 탭의 상태 변수"만 증가시킵니다.
      // 그래서 탭별로 서로 영향을 주지 않고 독립적으로 동작합니다.
      switch (selectedTabIndex) {
        case 0:
          _tab1Count += 1;
          return;
        case 1:
          _tab2Count += 1;
          return;
        case 2:
          _tab3Count += 1;
          return;
      }
    });
  }
}

/// 각 탭에서 공통으로 쓰는 카운터 UI 위젯입니다.
class _CounterTab extends StatelessWidget {
  const _CounterTab({
    required this.count,
  });

  final int count;

  @override
  Widget build(BuildContext context) =>
      Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              '$count',
              style: const TextStyle(
                fontSize: 92,
                fontWeight: FontWeight.w500,
                color: Colors.black,
              ),
            ),
            const SizedBox(height: 20)
          ],
        ),
      );
}
