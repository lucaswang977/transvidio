# Transvid.io
An online translation collaborative platform which enables project-based translation management, it supports different editors which can deal with video subtitle, structured data, attachment file etc.

## Stack used
- React.js
- Next.js
- T3Stack(tRPC)
- Shadcn/ui
- Prisma
- NextAuth
- PostgreSQL

## Fundamental functions
- User registration with email & google account
- Role based (admin, editor) user management
- Project based document management
- A variety of document editors:
  - Course introduction
  - Curriculum
  - Video subtitle
  - Attachment
  - Quiz
- Document editing undo / redo
- OpenAI powered auto translation(auto fill)
- Azure natural synthesized voice dubbing
- Payout management for translators

## Functions to be implemented
- [ ] Dashboard related
  - [ ] User based notification
  - [ ] Ongoing projects & documents
  - [ ] Activity history
- [ ] User related
  - [ ] Password reset
  - [x] User profile(avatar, payment method)
  - [ ] Block user login / invalidate token
- [x] AI integration for productivity
  - [x] Prompt template
  - [x] Course intro, curriculum, article, quiz translation
  - [x] Video transcription & subtitle translation
  - [x] OpenAI model global config
  - [ ] Attachment translation
- [ ] Document edit history and restore back
- [x] Payout management
  - [x] Exchange rate support based on USD
  - [x] Auto generate income records on documents
  - [x] Auto generate payout records on projects
- [x] AI dubbing
  - [x] Voice synthesis based on translated subtitles
  - [x] Voice duration indicator based on the segment length 
  - [x] Synced synthesized voice & original video playback

## Screenshots
- Document list

![document list](https://github.com/lucaswang977/transvidio/blob/main/screenshots/document-list.jpg?raw=true)

- Editor on Introduction

![editor on introduction](https://github.com/lucaswang977/transvidio/blob/main/screenshots/editor-intro.jpg?raw=true)

- Editor on Subtitle

![editor on subtitle](https://github.com/lucaswang977/transvidio/blob/main/screenshots/editor-subtitle.jpg?raw=true)

- My revenue list

![revenue](https://github.com/lucaswang977/transvidio/blob/main/screenshots/payout.jpg?raw=true)

