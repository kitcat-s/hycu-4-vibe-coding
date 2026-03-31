// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:namecard/main.dart';

void main() {
  testWidgets('디지털 명함 기본 렌더링 테스트', (WidgetTester tester) async {
    // pumpWidget: 테스트 환경에서 위젯 트리를 빌드한다.
    await tester.pumpWidget(const NameCardApp());

    // 1) 앱 타이틀(AppBar 제목)이 제대로 표시되는지 확인한다.
    expect(find.text('Digital Name Card'), findsOneWidget);

    // 2) 프로필 이름과 직책이 화면에 존재하는지 확인한다.
    expect(find.text('Jane Doe'), findsOneWidget);
    expect(find.text('Software Engineer'), findsOneWidget);

    // 3) CircleAvatar(프로필 아바타)가 하나 존재하는지 확인한다.
    expect(find.byType(CircleAvatar), findsOneWidget);
  });
}
