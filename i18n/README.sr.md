> Овај фајл је аутоматски преведен помоћу **ChatGPT**.  
> Оригинална документација је написана на **енглеском и португалском**.  
> Ако пронађете грешке у преводу и добро познајете српски језик,  
> слободно их исправите и пошаљите **Pull Request (PR)**.  
> Цела заједница ће вам бити веома захвална за ваш допринос! 🙌  

<p align="center">
  <a href="https://cmmv.io/" target="blank"><img src="https://raw.githubusercontent.com/cmmvio/docs.cmmv.io/main/public/assets/logo_CMMV2_icon.png" width="300" alt="CMMV Logo" /></a>
</p>
<p align="center">Contract-Model-Model-View (CMMV) <br/> Изградња скалабилних и модуларних апликација коришћењем уговора.</p>
<p align="center">
    <a href="https://www.npmjs.com/package/@cmmv/core"><img src="https://img.shields.io/npm/v/@cmmv/core.svg" alt="NPM верзија" /></a>
    <a href="https://github.com/cmmvio/cmmv/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@cmmv/core.svg" alt="Лиценца пакета" /></a>
    <a href="https://dl.circleci.com/status-badge/redirect/circleci/QyJWAYrZ9JTfN1eubSDo5u/7gdwcdqbMYfbYYX4hhoNhc/tree/main" target="_blank"><img src="https://dl.circleci.com/status-badge/img/circleci/QyJWAYrZ9JTfN1eubSDo5u/7gdwcdqbMYfbYYX4hhoNhc/tree/main.svg" alt="CircleCI" /></a>
</p>

<p align="center">
  <a href="https://cmmv.io">Документација</a> &bull;
  <a href="https://github.com/cmmvio/cmmv/issues">Пријави проблем</a>
</p>

## Опис (Description)

CMMV (Contract Model View) представља револуцију у развоју веб апликација, разбијајући парадигме и редефинишући начин на који стварамо, одржавамо и скалирамо дигиталне пројекте. Инспирисан најбољим праксама и иновативним концептима, CMMV интегрише снагу уговора за аутоматско генерисање робусних и сигурних структура, елиминишући сложеност ручног кодирања и пружајући јединствено искуство развоја.

Замислите платформу где дефинисање уговора у TypeScript-у постаје срце ваше апликације, аутоматски генеришући API-је, контролере, ORM ентитете и чак комуникацију преко бинарног RPC-а, све то са оптимизованим перформансама и беспрекорном интеграцијом са најмодернијим технологијама. Са CMMV-ом не само да убрзавате развој, већ и осигуравате квалитет и конзистентност свог кода, драстично смањујући број грешака и потребу за поновним радом.

Поред тога, CMMV нуди реактиван и лаган интерфејс, заснован на Vue 3, али са могућношћу подршке и за друге оквире као што су React и Angular, са увек фокусом на перформансе и SEO. Са CMMV-ом, frontend није само презентациони слој, већ интегрални и динамички део ваше апликације, синхронизован у реалном времену са backend-ом.

Било да сте искусан програмер или почетник, CMMV омогућава свима да граде моћне, модерне и скалабилне системе, елиминишући техничке баријере и омогућавајући да креативност и иновације буду у центру вашег развојног пута. Ово није само оквир; ово је нови начин размишљања и изградње будућности веб апликација.

## Филозофија (Philosophy)

CMMV има за циљ да поједностави процес развоја користећи снажан TypeScript-ов систем типова и декораторе. Елиминише потребу за тешким frontend оквирима фокусирајући се на директну контролу над повезивањем података и интеракцијама, док истовремено одржава флексибилност кроз модуларни дизајн.

## Карактеристике (Features)

- **Развој вођен уговорима:** Користите TypeScript уговоре за дефинисање модела, контролера и других компоненти.
- **Модуларна архитектура:** Организујте своју апликацију помоћу модула, што омогућава лакше управљање и скалирање.
- **RPC & REST подршка:** Интегрисана подршка за бинарни RPC преко WebSocket-а и традиционалних REST API-ја.
- **Интеграција са Express-ом:** Беспрекорна интеграција са Express-ом за познато и робусно HTTP серверско окружење.
- **Проширивост:** Високо прилагодљиво и лако прошириво сопственим модулима и компонентама.

## Подешавање преко CLI (Setup with CLI)

CMMV сада пружа CLI (Command Line Interface) за поједностављивање процеса инсталације и брзо подешавање вашег пројекта са жељеним конфигурацијама.

Да бисте иницијализовали нови пројекат, користите следећу команду:

```bash
$ pnpm dlx @cmmv/cli@latest create <ime-projekta>
```

Ова команда ће вас провести кроз поступак подешавања, постављајући питања о вашим жељеним конфигурацијама, као што су омогућавање Vite-а, RPC-а, кеширања, типа репозиторијума и подешавање приказа (нпр. Vue 3 или Reactivity). Аутоматски ће креирати неопходне фолдере и датотеке, подесити зависности и конфигурисати пројекат.

## Ручно подешавање (Legacy Setup)

Ако желите ручно да подесите пројекат, и даље можете појединачно инсталирати потребне модуле:

```bash
$ pnpm add @cmmv/core @cmmv/http @cmmv/view reflect-metadata class-validator class-transformer fast-json-stringify
```

## Брзи почетак (Quick Start)

Испод је једноставан пример како да креирате нову CMMV апликацију:

```typescript
import { Application } from "@cmmv/core";
import { DefaultAdapter, DefaultHTTPModule } from "@cmmv/http";
import { ViewModule } from "@cmmv/view";
import { ApplicationModule } from "./app.module";

Application.create({
    httpAdapter: DefaultAdapter,    
    modules: [
        DefaultHTTPModule,                
        ViewModule,        
        ApplicationModule
    ],
    services: [Repository],
    contracts: [...]
});
```

# Карактеристике (Features)

## 🟢 Језгро (Core)
- [x] Контрола апликације, учитавање уговора, модела и генерисање модела
- [x] Основa за креирање транспилера
- [x] Апстракција језгра за HTTP, WS, уговоре и сервисе
- [x] Основна имплементација за Singleton класу
- [x] Декоратори за уговоре, hook-ове, метаподатке и сервисе
- [x] Валидација конфигурације и контрола приступа у свим модулима
- [x] Hook систем
- [x] Телеметрија и логовање
- [x] Основa за креирање регистра

## 🔐 Аутентификација (Auth)
- [x] Општа контрола приступа апликацији
- [x] Локална регистрација и пријава корисника
- [ ] Пријава преко провајдера (Google, Facebook, итд.)
- [x] reCAPTCHA
- [x] Освежавајући токен за продужење сесије
- [x] Потпуна подршка за 2FA са генерисањем и верификацијом QR кода
- [x] Контрола сесије заснована на отиску прста, IP адреси и user agent-у

## 🚀 Кеширање (Cache)
- [x] Оптимизовани системски одговори коришћењем кеша у меморији компатибилног са Redis-ом, Memcached-ом, MongoDB-ом или бинарним фајловима
- [x] Једноставни интеграциони декоратори за контролере и gateway-е
- [x] Аутоматска интеграција са уговорима
- [x] API за преузимање, ажурирање или брисање кешираних података

## 🌐 HTTP
- [x] API доступност преко `@cmmv/server` или других адаптера као што је Express
- [x] Аутоматско генерисање контролера и сервиса
- [x] Интеграција са `@cmmv/cache` и `@cmmv/auth`
- [x] Express адаптер
- [ ] Fastify адаптер

## 📡 Protobuf
- [x] Генерисање `.proto` фајлова за RPC комуникацију на основу уговора
- [x] Генерисање интерфејса и дефиниција типова за TypeScript
- [x] Генерисање JSON уговора за употребу на фронтенду
- [x] Повезивање уговора

## 🗄 Репозиторијум (Repository)
- [x] Интеграција са SQLite, MySQL, PostgreSQL, SQL Server, Oracle и MongoDB
- [x] Аутоматско креирање ентитета за TypeORM
- [x] Аутоматско генерисање индекса
- [x] Аутоматско генерисање релација
- [x] Валидација података
- [x] CRUD операције за RPC и REST
- [x] Филтери за претрагу (сортирање, филтрирање по ID-у, пагинација)
- [x] Замена сервиса за директну интеграцију са репозиторијумом
- [x] Интеграција са `@cmmv/cache`, `@cmmv/auth`

## ⏳ Заказивање задатака (Scheduling)
- [x] Декоратори за креирање заказаних задатака (cron)
- [x] Управљање заказаним задацима

## 🎨 Поглед (View)
- [x] SSR за оптимизацију SEO
- [x] Динамички темплејти слични EJS
- [x] Engine за приказ компатибилан са Express-ом
- [x] Подршка за интернационализацију (i18n)
- [x] Директно укључивање под-погледа у HTML
- [x] Динамичко управљање метаподацима (script-ови, линкови, meta, header, title)
- [x] Паковање CSS-а и JavaScript-а
- [x] Транспарентна интеграција са RPC

## 🔄 WebSocket (WS)
- [x] Аутоматско генерисање RPC gateway-а за комуникацију
- [x] Апстракција за паковање података
- [x] Имплементација WebSocket комуникације за клијента и сервер

## 🧩 Модули (Modules)
- [x] **Swagger:** Омогућава API документацију са Swagger интеграцијом
- [x] **Testing:** Укључује unit тестирање, S2S тестирање и mock-ове
- [x] **Elastic:** Интеграција са Elasticsearch за управљање индексима и документима
- [x] **Email:** Модул за обраду е-поште преко SMTP или AWS SES
- [x] **Encryptor:** Енкрипција заснована на ECC, AES-256-GCM
- [x] **Events:** Арhитектура заснована на догађајима за несметану комуникацију
- [x] **Inspector:** Алатке за дебаговање и мониторинг
- [x] **Keyv:** Интеграција key-value складишта помоћу Keyv-а
- [x] **Normalizer:** Модул за трансформацију података за парсирање (JSON, XML, YAML, CSV)
- [x] **Queue:** Управљање редовима задатака (Kafka, RabbitMQ, Redis)
- [x] **UI:** UI компоненте за изградњу динамичких апликација
- [x] **Vue:** Омогућава интеграцију са Vue.js