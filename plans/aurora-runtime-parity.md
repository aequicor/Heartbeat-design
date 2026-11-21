# Сверка Aurora-DS с Compose

Рабочий документ — [Aurora-DS](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-175087).
Область сверки включает все страницы файла, мастер-компоненты, их экземпляры и самостоятельные кадры.
Источники — текущее дерево Compose, снимки `AiStudioScreenScreenshotTest` и сценариев содержимого,
а для «Длинной истории» — снимок запущенного Windows Heartbeat.

## Направление

- Продукт — рабочее пространство для проектов, сессий, файлов и диалогов с агентом.
- Характер — спокойный, компактный, читаемый.
- Мир — рабочие записи и инструменты на зелёной подложке Aurora.
- Моменты — чтение ответа, просмотр содержимого, ход работы и запрос решения.
- Сигнатура — непрерывный рисунок под плавающим управлением и лентой.

Направление задано поручением воспроизвести работающий интерфейс. Шрифты Windows берутся из Desktop
`Main.kt`, шкала размеров и цветов — из дизайн-системы Compose. Android сверяется отдельно по
экрану проекта, шапке, вводу, файлам, запросам и просмотру. Настройки окна и системная область
Android проверяются по платформенному сценарию.

## Аудит

Проверяются отступы, поверхности и семантические цвета, глифы, подписи, размеры текста,
компоновка, состояния загрузки и ошибки, наведение и клавиатурный фокус. Текст интерфейса
и компоненты должны оставаться редактируемыми. Для анимации и взаимодействия проверяется связь
с соответствующим состоянием Compose. Снимки фиксируют вид кадра в конкретный момент.

## Эталон реализации

При расхождениях с опубликованным `master` оператор выбрал локальную рабочую версию Heartbeat-v2. Для проверки доступны Kotlin-файлы компонентов Aurora, их screenshot-тесты и 103 сохранённых изображения Compose. Ранее прочитанная [ревизия f26474e](https://github.com/aequicor/Heartbeat-v2/tree/f26474ebccd4a1f604c5034d0cd2f5a38b62f335) служит исторической ссылкой. Например, размещение масштаба и центрирования в окне диаграммы подтверждают локальные `AuroraSourceBlock.kt`, `AuroraDiagramViewport.kt` и `AuroraSourceBlockTest.kt`.

| Страница Aurora-DS | Что проверялось | Эталон |
| --- | --- | --- |
| [Исходные компоненты](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-8576) | 240 мастеров с учётом новой плитки файла. История и сообщения, инструменты и Thinking, запросы, вложения, режимы доступа, ввод, прокрутка, фон и фирменные знаки. | Компоненты `AuroraHistory`, `AuroraWorkEvent`, `AuroraRequests`, `AuroraComposer`, `AuroraPanes` и их платформенные роли. |
| [Desktop](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-175086) | Два состояния длинной истории, пустой чат, загрузка, ошибка отправки, активный ход, лист раскрытия Thinking и окно с правой панелью файлов. | Окно Heartbeat, `aurora-windows-parity.png`, `aurora-composer-running.png`, `aurora-work-parity.png`. |
| [Просмотр и подсказки](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=305-162366) | Девять кадров, 17 мастеров. Масштаб 100% и 125%, ширина 640, подсказка при наведении и фокусе, неактивное окно, исходник, панорамирование и переполнение по двум осям. | `AuroraSourceBlockTest`, `AuroraDesktopHoverTest`, PNG `aurora-viewer-windows-centered`, `oversized`, `panned`. |
| [Android](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=305-162815) | Семь кадров. Чат, клавиатура, ход работы, завершение, запрос разрешения, лист доступности и сообщения с вложениями. | `aurora-android-header-parity.png`, `aurora-touch.png`, `aurora-touch-request.png`, `aurora-android-files-screen.png`. |
| [Потоковый Markdown](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=309-165413) | Один лист с шестью сценариями. Проектный интервал доставки выделен отдельно. | Локальные `AuroraReplyReveal`, `AuroraTailFollow` и `AuroraStreamingRevealTest`. |

Для визуальной сверки через Figwright получены снимки 25 окон и листов и исходных 256 мастеров. После появления общей плитки файла в библиотеке всего 257 мастеров. Новая плитка и затронутые кадры повторно прочитаны и сняты после правок. Android проверялся по изображению Compose в touch-компоновке, Windows также сравнивался с запущенным приложением.

## Запросы, вложения и файлы диалога

После разрешения оператора прочитаны готовые PNG из тестов Compose. Для сверки файлов и запросов использованы `aurora-desktop-files.png`, `aurora-android-files-screen.png`, `aurora-request-desktop.png` и `aurora-touch-request.png`. Мобильные изображения получены тестами Compose с touch-компоновкой.

В Windows панель файлов при высоте окна 900 занимает 320 × 860 px. На Android внутреннее содержимое экрана 390 × 844 занимает 370 × 824 px. Высота шапки составляет 40 и 56 px соответственно, размеры кнопок — 32 и 48 px. Имена файлов, подписи и размеры используют платформенные стили. PNG, как и остальные файлы, показан плиткой с расширением. [Панель Windows](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-102710) · [Экран Android](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-103609)

Повторно прочитаны 39 изменённых объектов, в том числе 14 карточек вложений. У горизонтальной полосы ползунок длиной 423 px теперь помещается на дорожке 624 px. Пять образцов LaTeX сохранены с пометкой «Проектные варианты». Реализация специализированного просмотра есть для Mermaid и PlantUML. [Горизонтальная прокрутка](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-37988)

В шести узких мастерах запросов с видимой навигацией страницы перенесены под заголовок с отступом 4 px и выровнены вправо. В контрольном образце шириной 346 px заголовку теперь доступны все 314 px вместо прежних 46 px. Шапка занимает 60 px, весь запрос — 243 px. Геометрия прочитана для всех шести мастеров, два из них дополнительно проверены на снимках Figwright. В Compose порог для размещения навигации в одну строку равен 520 dp доступной ширины при масштабе текста до 1,35. [Узкий запрос](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-104673) · [Второй вопрос](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-104720) · [Широкий запрос](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-105960)

У [запроса разрешения в чате Android](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-95131) восстановлена кнопка «Остановить работу» в шапке. Она использует глиф из библиотеки, цвет `request/secondary` и область нажатия 48 × 48 px. Панель закреплена в 10 px от нижнего края внутренней поверхности. Обе кнопки решения целиком видны в кадре 390 × 844.

На PNG `scrollbar-rest`, `scrollbar-hover`, `scrollbar-drag`, `scrollbar-edge-drag` и `scrollbar-touch-scroll` ширина вертикального ползунка составляет соответственно 4, 6, 6, 6 и 4 px. В трёх мастерах перетаскивания исправлены ширина, радиус и центрирование. В горизонтальном варианте при перетаскивании толщина составляет 8 px. Декоративная сфера из скрытого слоя пустого диалога сохранена как проектный образец. [Вертикальная прокрутка](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-83827) · [Таблица](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-104089) · [Сфера](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-55683)

## Проверенные изменения

С согласия оператора обновлены 75 мастеров инструментов и Thinking. Пример Desktop взят при ширине строки 558 px, мобильный — при 249 px. Вложенные подробности заполняют родителя. Для завершённого действия Desktop статус использует `HbAuroraColors.Green` (#4D6B48). Описание действия Android использует роль Caption 14/20 и цвет вторичного текста. После записи повторно прочитаны все 75 мастеров. На контрольном Desktop заголовок занимает 427 px, а вся строка — 32 px. Мобильное описание переносится, область нажатия занимает минимум 48 px. [Desktop](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=35-162385) · [Android](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-9074) · [Thinking](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=35-179397)

В приложении `AiStudioBrandMark` рисует линию пульса. Семь перламутровых сердец, пять сердец с заворотом и три композиции со словом Heartbeat и двумя ударами сохранены в библиотеке с префиксом «Проектные варианты». Проверены названия 15 мастеров после записи. [Перламутровое сердце](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-112652) · [Сердце с заворотом](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-113829) · [Название и ритм](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-113952)

Локальный `AuroraReplyReveal` проявляет новые слова по очереди, сохраняет непрозрачность уже показанного текста и выводит текст целиком при уменьшении движения. `AuroraTailFollow` удерживает нижний край, сохраняет место чтения при прокрутке и возвращает к новым сообщениям. Интервал 32 мс на листе обозначен как проектный. [Шесть сценариев](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=309-165413)

Проверены снимки Windows и Android, полученные через Figwright после правки библиотеки. На Windows открытая «Длинная история» подтверждает пустой ввод, контекст 71% и ответ «Остановка запроса». В приложении PlantUML был переключён на исходник, в основном кадре показана диаграмма. Для Android использованы статические сцены и PNG из screenshot-тестов Compose. [Длинная история](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-175087) · [Пустой чат](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-55599) · [Загрузка](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-55910) · [Ошибка](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-56219) · [Генерация](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-62801) · [Активный этап Android](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-94154)

## Сверка с локальным Compose

Полноэкранный просмотр готовой диаграммы держит в одной шапке уменьшение, процент на Desktop, увеличение, центрирование, переключение исходника, копирование и закрытие. В режиме исходника появляются перенос строк и возврат к диаграмме. Для переполнения у viewport есть собственные полосы. [Просмотр](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=305-162367) · [Исходник](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=305-162757) · [Переполнение](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=309-163190)

В сообщениях шесть вариантов вложений используют общую плитку 40 × 40 с глифом 18 px. Под именем указан тип файла. Восемь образцов передачи, ошибок, привязки к строкам и статистики патча сохранены в проектной части библиотеки. Четыре композиции с отдельным списком задач, измеримым прогрессом или специальным просмотром diff также получили проектную пометку. [Плитка файла](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=314-165480) · [Вложения в чате](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-174759) · [Пример с diff](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-98482)

В мастерах строгого разрешения доступны «Разрешить один раз» и «Отклонить». При ширине панели 320 px они занимают отдельные строки по 48 px, при 346 px помещаются в одну строку. Высота двух полей свободного ответа растёт вместе с текстом. [320 px](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-106099) · [346 px](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-96535) · [Свободный ответ](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-104720)

В Desktop высота кнопок отправки и доступа составляет 32 px. У мобильного режима доступа высота 48 px. В семи мобильных сценах, включая вложенный экран с клавиатурой, углы контура и рабочей поверхности чата имеют радиус 20 px. Обводка шириной 2 px проходит через цвета Pearl, Lavender и Pearl. Вторая строка шапки начинается у левого края поверхности чата, а справа у показателя контекста сохраняется отступ 12 px. [Desktop](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-37100) · [Чат Android](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-50654) · [Клавиатура](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-69831)

## Приоритет Desktop

В шести окнах Windows сверены видимые роли навигации и шапки с локальным Compose. Для строк списка проектов задан интервал 2 px. При загрузке до выбора чата видна центральная подпись «Загрузка истории…». В активном диалоге поле ввода показывает остановку, в пустом — отправку. [Пустой диалог](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-55599) · [Загрузка](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-55910) · [Ошибка](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-56219) · [Генерация](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-62801)

В сцене восстановления связи на Windows 1440 × 900 короткий ответ «Да. Черновик сохранён.» занимает 190 × 66 px на высоте 145 px. Между репликами разных авторов 12 px. Карточка раскрытого этапа начинается на высоте 301 px, как в «aurora-windows-parity.png». В ней результат инструмента выделен зелёным, а текст размышлений отображается один раз. При чтении старых сообщений внизу справа видна кнопка возврата. [Восстановление связи](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-8577) · [К новым сообщениям](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=318-165570)

В окне с файлами при размере 1440 × 900 слева остаётся навигация, чат занимает 792 px, а справа открыта панель шириной 320 px. Контекст 61% переходит на отдельную строку. Вложение aurora-report.md показано в ответе и в ноябрьском списке файлов. Кадр сверён с «aurora-desktop-files.png». В Android список файлов открывается отдельным экраном. [Окно Desktop](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=318-165573) · [Файлы на Android](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=305-162815)
