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

## Состояние при первом чтении файла

| Раздел Figma | Найдено | Опора в Compose |
| --- | --- | --- |
| [Библиотека](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-8576) | 239 мастер-компонентов. Есть варианты инструментов, Thinking, запросов, сообщений, вложений, прокрутки и темы. | `HbAuroraColors`, `HbAuroraLayout`, `HbTypeScales`, `AuroraTypography`, `AuroraWorkEvent`, `AuroraComposer`, `AuroraRequestPanel`. |
| [Desktop](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-175086) | Подтверждены кадры «Длинная история», пустой чат, загрузка истории, ошибка отправки и генерация. Полный список требует постраничного чтения небольшими порциями. | `aurora-windows-parity.png`, `aurora-composer-running.png`, `aurora-composer-draft.png`, `aurora-desktop-files.png`, `aurora-request-desktop.png`, снимок запущенной «Длинной истории». |
| [Просмотр и подсказки](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=305-162366) | 8 кадров состояний и 13 мастер-компонентов. Есть просмотр 100% и 125%, узкое окно, исходник, перетаскивание, наведение, потеря активности и клавиатурный фокус. | `AuroraSourceBlockTest`, `AuroraDesktopHoverTest`, `aurora-source-code-fullscreen.png`, `aurora-viewer-windows-centered.png`, `aurora-viewer-windows-oversized.png`, `aurora-viewer-windows-panned.png`. |
| [Android](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=305-162815) | 7 верхнеуровневых кадров. Есть чат, IME, активный этап, финал, запрос, матрица доступности и вложения. | `aurora-touch.png`, `aurora-touch-request.png`, `aurora-android-header-parity.png`, `aurora-android-files-screen.png`, `aurora-rich-document-android.png`. |

По состоянию на сверку оба мастера паттерна используют Multiply 32%. Compose использует 22%.
В кадре Windows «Длинная история» интенсивность уже скорректирована экземплярами, поэтому изменение
мастера должно сразу вернуть оригинальную непрозрачность этих экземпляров.
Общие стили хода работы используют Inter. При обновлении следует учесть платформу экземпляра:
в Windows используются роли Segoe UI, на Android — роли `HbTypeScales.Touch`.
На сравнительном снимке Android 390 × 844 пустой composer имеет светлую кнопку отправки,
а в текущем макете видна тёмная. `AuroraSendControl` использует в этом состоянии фон `Lavender`
(`#E8DFF7`), глиф `Primary` (`#75629F`) и подпись поля «Сообщение…».
При активной генерации показан Stop. В Desktop пустой ввод использует `#8C819D` и «Сообщение».
В `AuroraWorkspace` при отсутствии chat ID в центре показано «Загрузка истории…».
В полнооконном просмотре `SourceToolbar` показывает масштаб только при готовой диаграмме
и выключенном режиме исходника. Шаг масштабирования 1,25, пределы 25–400%.

## Повторная сверка 21 ноября

Сравниваем опубликованную реализацию [Heartbeat-v2 на ревизии f26474e](https://github.com/aequicor/Heartbeat-v2/tree/f26474ebccd4a1f604c5034d0cd2f5a38b62f335) и текущий файл Figma. Направление из пяти строк выше сохраняется. Оператор выбрал сохранять образцы без соответствия в реализации и помечать их в Figma как проектные.

В файле пять страниц. На странице просмотра теперь девять кадров и 17 местных мастер-компонентов, включая [переполнение по двум осям](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=309-163190). На отдельной странице размещён [лист из шести сценариев потокового Markdown](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=309-165413). В исходной библиотеке 239 мастеров. Android содержит семь кадров.

Две записи предыдущего аудита уже закрыты. В обоих мастерах рисунка непрозрачность слоя Multiply равна 22%, как в `AuroraBackdrop`. На [Android в чате с пустым вводом](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-50654) видны светлая кнопка отправки и «Сообщение…». Это состояние включает предыдущие сообщения пользователя и агента.

В [мастере Desktop-инструмента](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=35-162385) заголовок занимал 1 px, а свёрнутая строка — 392 px в высоту. В `AuroraWorkEventHeader` заголовок получает свободную ширину, свёрнутый заголовок и статус занимают по одной строке. На touch заголовок и описание расположены друг под другом, а минимальная цель составляет 48 dp. В мастерах следует проверить адаптивную ширину текста, высоту по содержимому и роли описания отдельно для каждой платформы.

## Запросы, вложения и файлы диалога

После разрешения оператора прочитаны готовые PNG из тестов Compose. Для сверки файлов и запросов использованы `aurora-desktop-files.png`, `aurora-android-files-screen.png`, `aurora-request-desktop.png` и `aurora-touch-request.png`. Мобильные изображения получены тестами Compose с touch-компоновкой.

В Windows панель файлов при высоте окна 900 занимает 320 × 860 px. На Android внутреннее содержимое экрана 390 × 844 занимает 370 × 824 px. Высота шапки составляет 40 и 56 px соответственно, размеры кнопок — 32 и 48 px. Имена файлов, подписи и размеры используют платформенные стили. PNG, как и остальные файлы, показан плиткой с расширением. [Панель Windows](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-102710) · [Экран Android](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-103609)

Повторно прочитаны 39 изменённых объектов, в том числе 14 карточек вложений. У горизонтальной полосы ползунок длиной 423 px теперь помещается на дорожке 624 px. Пять образцов LaTeX сохранены с пометкой «Проектные варианты». Реализация специализированного просмотра есть для Mermaid и PlantUML. [Горизонтальная прокрутка](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-37988)

В шести узких мастерах запросов с видимой навигацией страницы перенесены под заголовок с отступом 4 px и выровнены вправо. В контрольном образце шириной 346 px заголовку теперь доступны все 314 px вместо прежних 46 px. Шапка занимает 60 px, весь запрос — 243 px. Геометрия прочитана для всех шести мастеров, два из них дополнительно проверены на снимках Figwright. В Compose порог для размещения навигации в одну строку равен 520 dp доступной ширины при масштабе текста до 1,35. [Узкий запрос](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-104673) · [Второй вопрос](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-104720) · [Широкий запрос](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-105960)

## Проверенные изменения

С согласия оператора обновлены 75 мастеров инструментов и Thinking. Пример Desktop взят при ширине строки 558 px, мобильный — при 249 px. Вложенные подробности заполняют родителя. Для завершённого действия Desktop статус использует `HbAuroraColors.Green` (#4D6B48). Описание действия Android использует роль Caption 14/20 и цвет вторичного текста. После записи повторно прочитаны все 75 мастеров. На контрольном Desktop заголовок занимает 427 px, а вся строка — 32 px. Мобильное описание переносится, область нажатия занимает минимум 48 px. [Desktop](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=35-162385) · [Android](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-9074) · [Thinking](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=35-179397)

В приложении `AiStudioBrandMark` рисует линию пульса. Семь перламутровых сердец, пять сердец с заворотом и три композиции со словом Heartbeat и двумя ударами сохранены в библиотеке с префиксом «Проектные варианты». Проверены названия 15 мастеров после записи. [Перламутровое сердце](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-112652) · [Сердце с заворотом](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-113829) · [Название и ритм](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-113952)

Лист потокового Markdown сохраняет все шесть сценариев и получил видимую пометку «проектный вариант». В `DefaultAiStudioStore` первая порция нового хода обрабатывается без искусственной задержки. Для последующих обновлений того же хода `RenderInterval` равен 16 мс. На листе рядом с проектным окном 32 мс указано значение работающего кода. [Лист сценариев](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=309-165413)

Проверены снимки Windows и Android, полученные через Figwright после правки библиотеки. На Windows открытая «Длинная история» подтверждает пустой ввод, контекст 71% и ответ «Остановка запроса». В приложении PlantUML был переключён на исходник, в основном кадре показана диаграмма. На Android итоговая проверка пока охватывает статические кадры. [Длинная история](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-175087) · [Пустой чат](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-55599) · [Загрузка](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-55910) · [Ошибка](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-56219) · [Генерация](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-62801) · [Активный этап Android](https://www.figma.com/design/ivLmgulIBIkMzOw8sgvKxj/Aurora-DS?node-id=2-94154)
