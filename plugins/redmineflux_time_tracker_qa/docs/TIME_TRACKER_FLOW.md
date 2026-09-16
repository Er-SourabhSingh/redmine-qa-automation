# Plugin Flow — Redmineflux Time Tracker Plugin

> Key end-user flows used for test design. Derived from https://www.redmineflux.com/knowledge-base/plugins/time-tracker/

(Populate each flow with the exact click path observed on the instance under test during the first execution
session. The steps below are the KB-described flow and must be confirmed against the real UI before being relied on.)

## Flow 1: Install and configure

1. Extract the plugin into `plugins/` without renaming the folder.
2. `bundle install`; `RAILS_ENV=production bundle exec rails redmine:plugins:migrate`; restart.
3. Administration → Plugins → Redmineflux Time Tracker Plugin → Configure.
4. Set the plugin options and save.

## Flow 2: Primary end-user flow

1.
2.
3.

## Flow 3: Administration flow

1.
2.
3.
