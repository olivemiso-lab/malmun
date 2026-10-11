// ════════════════════════════════════════════════════
//  말문 · 연습 문장 — 국제교류(대만 방문) 하루 흐름 순서
//  ko: 화면에 뜨는 한국어 / en: 대표 답 / alt: 이렇게 말해도 됨 / tip: 막힐 때 도움말
//  상대도 영어가 모국어가 아니므로 짧고 쉬운 문장을 고른다.
// ════════════════════════════════════════════════════
const SETS = [
  {
    id: 'welcome', emoji: '👋', title: '맞이하기·소개', desc: '처음 만났을 때',
    items: [
      { ko: '우리 학교에 오신 것을 환영합니다.', en: 'Welcome to our school.', alt: ['We are so happy to have you here.'] },
      { ko: '만나서 반가워요.', en: 'Nice to meet you.', alt: ['It is nice to meet you.'] },
      { ko: '저는 이 학교 교사예요. 4학년을 가르쳐요.', en: 'I am a teacher at this school. I teach fourth grade.', tip: '학년만 바꿔 말해 보세요. 3학년 third, 5학년 fifth, 6학년 sixth' },
      { ko: '편하게 이름으로 불러 주세요.', en: 'Please call me by my first name.', alt: ['You can just call me by my name.'] },
      { ko: '오시는 길은 어떠셨어요?', en: 'How was your trip?', alt: ['How was your flight?'] },
      { ko: '많이 피곤하시죠?', en: 'You must be tired.', alt: ['Are you tired?'] },
      { ko: '한국은 처음이세요?', en: 'Is this your first time in Korea?' },
      { ko: '대만 어느 도시에서 오셨어요?', en: 'Which city in Taiwan are you from?', alt: ['Where in Taiwan are you from?'] },
      { ko: '이름을 어떻게 발음하나요?', en: 'How do you pronounce your name?', tip: '이름을 잘 못 알아들었을 때 쓰기 좋아요. Could you say your name again?' },
      { ko: '이쪽으로 오세요.', en: 'Please come this way.', alt: ['This way, please.'] },
      { ko: '가방은 여기 두셔도 돼요.', en: 'You can leave your bags here.' },
      { ko: '필요한 게 있으면 언제든지 말씀해 주세요.', en: 'If you need anything, just let me know.', alt: ['Please tell me if you need anything.'] }
    ]
  },
  {
    id: 'tour', emoji: '🏫', title: '학교 안내', desc: '교실·시설 소개',
    items: [
      { ko: '학교를 안내해 드릴게요.', en: 'Let me show you around our school.', alt: ['I will show you our school.'] },
      { ko: '여기는 교무실이에요.', en: 'This is the teachers\' office.', tip: '교무실 = 선생님들 사무실. teachers\' room이라고 해도 돼요.' },
      { ko: '여기는 우리 반 교실이에요.', en: 'This is my classroom.', alt: ['This is our classroom.'] },
      { ko: '여기는 도서관이에요. 학생들이 쉬는 시간에 책을 읽어요.', en: 'This is the library. Students read books here during breaks.' },
      { ko: '여기는 급식실이에요.', en: 'This is the cafeteria.', alt: ['This is the lunchroom.'], tip: '단어가 안 떠오르면 This is where we eat lunch.' },
      { ko: '운동장은 저쪽에 있어요.', en: 'The playground is over there.', alt: ['The sports field is over there.'] },
      { ko: '화장실은 저쪽에 있어요.', en: 'The restroom is over there.', alt: ['The bathroom is over there.'] },
      { ko: '학생들은 학교 안에서 실내화를 신어요.', en: 'Students wear indoor shoes inside the school.', tip: '실내화가 안 떠오르면 the shoes we wear inside' },
      { ko: '우리 학교에는 학생이 약 800명 있어요.', en: 'We have about 800 students at this school.', tip: '숫자만 바꿔 말해 보세요.' },
      { ko: '수업은 40분이고 쉬는 시간은 10분이에요.', en: 'Each class is 40 minutes, and breaks are 10 minutes.' },
      { ko: '계단 조심하세요.', en: 'Watch your step.', alt: ['Be careful on the stairs.'] },
      { ko: '사진 찍으셔도 돼요.', en: 'You can take pictures.', alt: ['Feel free to take pictures.'] },
      { ko: '학생들 얼굴은 나오지 않게 찍어 주세요.', en: 'Please don\'t take pictures of the students\' faces.', tip: '학생 초상권 안내. Please be careful with students\' faces.' }
    ]
  },
  {
    id: 'schedule', emoji: '🕘', title: '일정 안내', desc: '오늘 할 일·이동',
    items: [
      { ko: '오늘 일정을 알려 드릴게요.', en: 'Let me tell you about today\'s schedule.', alt: ['Here is today\'s schedule.'] },
      { ko: '먼저 수업을 보시고, 그다음에 학생 교류 활동을 해요.', en: 'First, you will watch a class. After that, the students will do an exchange activity.' },
      { ko: '점심은 12시에 먹어요.', en: 'Lunch is at 12.', alt: ['We will have lunch at 12.'] },
      { ko: '10분 뒤에 시작할게요.', en: 'We will start in 10 minutes.', tip: '"~뒤에"는 in. in 5 minutes, in an hour' },
      { ko: '강당으로 이동할게요.', en: 'Let\'s move to the auditorium.', alt: ['Let\'s go to the hall.'], tip: '강당이 안 떠오르면 the big room for events' },
      { ko: '2시에 여기서 다시 만나요.', en: 'Let\'s meet here again at 2.' },
      { ko: '일정이 조금 바뀌었어요.', en: 'There is a small change in the schedule.', alt: ['The schedule has changed a little.'] },
      { ko: '시간이 조금 남았어요.', en: 'We have a little extra time.', alt: ['We have some time left.'] },
      { ko: '조금 서둘러야 해요.', en: 'We need to hurry a little.' }
    ]
  },
  {
    id: 'class', emoji: '🧑‍🏫', title: '수업 영어', desc: '공개수업 진행',
    items: [
      { ko: '안녕하세요, 여러분. 오늘 대만에서 특별한 손님들이 오셨어요.', en: 'Hello, everyone. Today we have special guests from Taiwan.' },
      { ko: '다 같이 큰 박수로 환영해 줄까요?', en: 'Let\'s give them a big hand!', alt: ['Let\'s welcome them with a big clap.'] },
      { ko: '오늘은 한국 전통 놀이에 대해 배울 거예요.', en: 'Today we are going to learn about Korean traditional games.', tip: '주제만 바꿔 말해 보세요. Today we are going to learn about ~' },
      { ko: '모두 저를 봐 주세요.', en: 'Eyes on me, please.', alt: ['Everyone, look at me, please.'] },
      { ko: '잘 들어 보세요.', en: 'Please listen carefully.' },
      { ko: '네 명씩 모둠을 만드세요.', en: 'Please make groups of four.', alt: ['Get into groups of four.'] },
      { ko: '모둠마다 대만 친구가 한 명씩 들어가요.', en: 'Each group will have one friend from Taiwan.' },
      { ko: '한 장씩 가져가고 뒤로 넘겨 주세요.', en: 'Take one and pass the rest back.', alt: ['Take one sheet and pass it on.'] },
      { ko: '먼저 제가 보여 줄게요.', en: 'Let me show you first.', alt: ['Watch me first.'] },
      { ko: '10분 동안 해 보세요.', en: 'You have 10 minutes.' },
      { ko: '1분 남았어요.', en: 'One minute left.', alt: ['You have one minute left.'] },
      { ko: '다 했으면 손을 드세요.', en: 'Raise your hand when you are finished.', alt: ['If you are done, raise your hand.'] },
      { ko: '질문 있나요?', en: 'Any questions?', alt: ['Do you have any questions?'] },
      { ko: '이해했으면 엄지를 들어 주세요.', en: 'Thumbs up if you understand.', tip: '말로 묻는 것보다 동작으로 확인하는 게 비원어민 학생에게 쉬워요.' },
      { ko: '잘했어요!', en: 'Great job!', alt: ['Well done!', 'Good job!'] },
      { ko: '좋은 생각이에요.', en: 'That is a great idea.', alt: ['Great idea!'] },
      { ko: '천천히 해도 괜찮아요.', en: 'Take your time.', alt: ['It is okay to go slowly.'] },
      { ko: '친구를 도와주세요.', en: 'Please help your friend.', alt: ['Help each other.'] },
      { ko: '이제 모둠별로 발표해 볼까요?', en: 'Now, each group will present.', alt: ['Let\'s share with the class.'] },
      { ko: '자리로 돌아가세요.', en: 'Please go back to your seats.' },
      { ko: '정리합시다.', en: 'Let\'s clean up.', alt: ['Let\'s tidy up.'] },
      { ko: '오늘 수업은 여기까지예요. 모두 수고했어요.', en: 'That is all for today. Good job, everyone.' },
      { ko: '대만 친구들에게 고맙다고 말해 볼까요?', en: 'Let\'s say thank you to our friends from Taiwan.' }
    ]
  },
  {
    id: 'exchange', emoji: '🤝', title: '학생 교류 활동', desc: '짝 활동·사진',
    items: [
      { ko: '서로 자기소개를 해 보세요.', en: 'Please introduce yourselves to each other.' },
      { ko: '이름, 나이, 좋아하는 것을 말해 주세요.', en: 'Say your name, age, and something you like.' },
      { ko: '짝과 함께 해 보세요.', en: 'Try it with your partner.', alt: ['Do it with your partner.'] },
      { ko: '돌아가면서 해요.', en: 'Let\'s take turns.' },
      { ko: '한국어로 "안녕하세요"는 이렇게 말해요.', en: 'In Korean, we say annyeonghaseyo.', alt: ['This is how we say hello in Korean.'] },
      { ko: '대만에서는 어떻게 말해요?', en: 'How do you say it in your language?', tip: '대만은 주로 중국어(Chinese)를 써요. in your language라고 하면 실수할 일이 없어요.' },
      { ko: '선물을 교환해요.', en: 'Let\'s exchange gifts.' },
      { ko: '다 같이 사진 찍어요!', en: 'Let\'s take a group photo!' },
      { ko: '모두 가운데로 모여 주세요.', en: 'Everyone, please come to the middle.', alt: ['Everyone, come closer.'] },
      { ko: '하나, 둘, 셋, 김치!', en: 'One, two, three, kimchi!' }
    ]
  },
  {
    id: 'lunch', emoji: '🍚', title: '점심·쉬는 시간', desc: '음식·가벼운 대화',
    items: [
      { ko: '점심 드시러 가요.', en: 'Let\'s go have lunch.', alt: ['Let\'s go eat lunch.'] },
      { ko: '이건 김치예요. 조금 매워요.', en: 'This is kimchi. It is a little spicy.' },
      { ko: '매운 음식 괜찮으세요?', en: 'Are you okay with spicy food?', alt: ['Can you eat spicy food?'] },
      { ko: '못 드시는 음식 있으세요?', en: 'Is there any food you can\'t eat?' },
      { ko: '입에 맞으세요?', en: 'How do you like the food?', alt: ['Do you like it?'] },
      { ko: '더 드릴까요?', en: 'Would you like some more?' },
      { ko: '커피나 차 드릴까요?', en: 'Would you like some coffee or tea?' },
      { ko: '대만 학교도 학교에서 점심을 먹나요?', en: 'Do students in Taiwan eat lunch at school too?' },
      { ko: '대만 음식 정말 좋아해요. 특히 버블티요.', en: 'I love Taiwanese food, especially bubble tea.' },
      { ko: '한국 날씨는 어때요?', en: 'How do you like the weather in Korea?', tip: '10월 말이라 쌀쌀해요. Is it cold for you?' }
    ]
  },
  {
    id: 'teachers', emoji: '☕', title: '선생님끼리 대화', desc: '교육 이야기',
    items: [
      { ko: '대만에서 몇 학년을 가르치세요?', en: 'What grade do you teach in Taiwan?' },
      { ko: '한 반에 학생이 몇 명이에요?', en: 'How many students are in your class?' },
      { ko: '우리 반은 24명이에요.', en: 'I have 24 students in my class.', tip: '숫자만 바꿔 말해 보세요.' },
      { ko: '대만 학교는 몇 시에 시작해요?', en: 'What time does school start in Taiwan?' },
      { ko: '한국은 3월에 새 학년이 시작해요.', en: 'In Korea, the school year starts in March.' },
      { ko: '대만에서는 몇 학년부터 영어를 배워요?', en: 'In Taiwan, what grade do students start learning English?', alt: ['When do students start learning English in Taiwan?'] },
      { ko: '한국에서는 3학년부터 영어를 배워요.', en: 'In Korea, students start learning English in third grade.' },
      { ko: '수업에서 태블릿을 자주 써요.', en: 'We often use tablets in class.' },
      { ko: '오늘 수업 어떠셨어요?', en: 'What did you think of the class today?', alt: ['How was the class today?'] },
      { ko: '좋은 의견 감사합니다.', en: 'Thank you for your feedback.' },
      { ko: '연락처를 주고받을까요?', en: 'Shall we exchange contact information?', alt: ['Can I have your contact information?'] },
      { ko: '계속 연락하고 지내요.', en: 'Let\'s keep in touch.' }
    ]
  },
  {
    id: 'survive', emoji: '🛟', title: '막혔을 때', desc: '못 알아듣거나 단어가 안 떠오를 때',
    items: [
      { ko: '다시 한번 말씀해 주시겠어요?', en: 'Could you say that again, please?', alt: ['Sorry, one more time, please.'] },
      { ko: '조금만 천천히 말씀해 주세요.', en: 'Could you speak a little more slowly?', alt: ['A little slower, please.'] },
      { ko: '잠깐만요, 생각 좀 해 볼게요.', en: 'Just a moment. Let me think.', alt: ['Give me a second.'] },
      { ko: '그걸 영어로 뭐라고 하죠?', en: 'How do you say it in English?', alt: ['What is the word in English?'] },
      { ko: '단어가 생각이 안 나는데, 무언가를 할 때 쓰는 거예요.', en: 'I can\'t think of the word, but it is something we use when we do something.', tip: '단어가 막힐 때 쓰는 만능 문장. it is something we use when ~ / it is a place where ~ / it is a person who ~' },
      { ko: '그러니까 이런 말씀이죠?', en: 'So, you mean this?', alt: ['Do you mean this?'], tip: '상대 말을 확인할 때. So, you mean ~?' },
      { ko: '쉽게 말하면 이런 거예요.', en: 'In simple words, it is like this.' },
      { ko: '번역 앱으로 보여 드릴게요.', en: 'Let me show you with a translation app.' },
      { ko: '제 영어가 완벽하지 않아요. 이해해 주세요.', en: 'My English is not perfect, so please be patient with me.', alt: ['My English is not perfect.'] },
      { ko: '맞아요, 바로 그거예요!', en: 'Yes, that\'s it!', alt: ['Exactly!'] }
    ]
  },
  {
    id: 'trouble', emoji: '🩹', title: '문제 상황', desc: '아픈 학생·늦을 때',
    items: [
      { ko: '괜찮으세요?', en: 'Are you okay?', alt: ['Are you feeling okay?'] },
      { ko: '이 학생이 배가 아프대요.', en: 'This student has a stomachache.', tip: '머리 headache, 배 stomachache, 목 sore throat' },
      { ko: '보건실로 데려갈게요.', en: 'I will take the student to the nurse\'s office.', tip: '보건실이 안 떠오르면 the school nurse' },
      { ko: '한 학생이 안 보여요.', en: 'One student is missing.', alt: ['I can\'t find one student.'] },
      { ko: '걱정 마세요. 금방 찾을게요.', en: 'Don\'t worry. We will find the student soon.' },
      { ko: '버스가 조금 늦어요.', en: 'The bus is a little late.' },
      { ko: '화장실 가고 싶은 사람 있나요?', en: 'Does anyone need to go to the restroom?' },
      { ko: '여기서 기다려 주세요.', en: 'Please wait here.' }
    ]
  },
  {
    id: 'goodbye', emoji: '🙏', title: '배웅', desc: '감사·작별 인사',
    items: [
      { ko: '오늘 와 주셔서 정말 감사합니다.', en: 'Thank you so much for coming today.' },
      { ko: '오늘 정말 즐거웠어요.', en: 'I really enjoyed today.', alt: ['I had a great time today.'] },
      { ko: '학생들이 정말 좋아했어요.', en: 'The students really loved it.' },
      { ko: '작은 선물이에요.', en: 'This is a small gift for you.' },
      { ko: '조심히 돌아가세요.', en: 'Have a safe trip back.', alt: ['Have a safe trip home.'] },
      { ko: '언젠가 대만에 꼭 가 보고 싶어요.', en: 'I would love to visit Taiwan someday.' },
      { ko: '또 만나요!', en: 'I hope to see you again!', alt: ['See you again!'] }
    ]
  }
];
