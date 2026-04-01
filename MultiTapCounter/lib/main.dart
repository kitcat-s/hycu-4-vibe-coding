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
  /// 탭 1 카운터 상태 (초기값 0)
  final int _tab1Count = 0;

  /// 탭 2 카운터 상태 (초기값 0)
  final int _tab2Count = 0;

  /// 탭 3 카운터 상태 (초기값 0)
  final int _tab3Count = 0;

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
      );
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
            const SizedBox(height: 20),
            OutlinedButton(
              onPressed: null,
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(220, 64),
                side: const BorderSide(
                  color: Colors.black12,
                ),
              ),
              child: const Text(
                'Increment',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      );
}
