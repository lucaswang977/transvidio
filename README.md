# Transvid.io

An online translation collaborative platform which enables project-based translation management, it supports different editors which can deal with video subtitle, structured data, attachment file etc.

## Fundamental functions
- User registration with email & google account
- Role based (admin, editor) user management
- Project management
- Document management
- A variety of document editors:
  - Course introduction
  - Curriculum
  - Video subtitle
  - Attachment
  - Quiz

## Functions to be implemented
- [ ] Dashboard related
  - [ ] User based notification
  - [ ] Ongoing projects & documents
  - [ ] Activity history
- [ ] User related
  - [ ] Password reset
  - [ ] User profile(avatar, payment method)
  - [ ] Block user login / invalidate token
- [ ] AI integration for productivity
- [ ] Document edit history and restore back
- [ ] Payment management
- [ ] AI dubbing

## Known important bugs
- [ ] Pagination reset when focus is back [#1]
- [x] Data batchly import should be outside the project
- [x] Upload directly to S3 since the serverless function limitation
