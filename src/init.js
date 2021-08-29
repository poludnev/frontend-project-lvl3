import { find } from 'lodash';
import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import viewHandlers from './viewHandlers.js';
import rssParser from './rssParser.js';
import ru from './locales/ru.js';
import 'bootstrap/dist/js/bootstrap.min.js';

export default () => i18next
  .init({
    lng: 'ru',
    resources: {
      ru,
    },
  })
  .then((locales) => {
    yup.setLocale({
      string: {
        url: () => 'invalidURL',
        // url: () => ({
        //   name: 'invalidURL',
        //   value: locales('feedback.invalidInput'),
        // }),
        matches: () => ({ name: 'invalidRSS', value: locales('feedback.invalidRSS') }),
      },
    });

    const schema = yup.object().shape({
      url: yup.string().url(),
      // rss: yup.string().matches(/<rss /),
      // status: yup.number().min(200).max(200),
    });

    const state = {
      rssRequestingProcess: {
        validationState: 'valid',
        state: 'initial',
        errors: [],
      },
      feedbackMessage: '',
      errors: [],
      texts: {
        feeds: locales('feedsTitle'),
        posts: locales('posts.title'),
        postButton: locales('posts.button'),
        successMessage: locales('feedback.success'),
        errors: {
          invalidURL: locales('errors.invalidURL'),
          urlExists: locales('errors.urlExists'),
          invalidRSS: locales('errors.invalidRSS'),
          networkError: locales('errors.networkError'),
        },
      },
      feeds: [],
      posts: [],
    };

    const watchedState = onChange(state, (path, current) => {
      // console.log('state chang', path, current);
      // if (path === 'errors') {
      // viewHandlers.error;
      // }
      if (path === 'formState') {
        viewHandlers[current](onChange.target(watchedState));
      }
      if (path === 'rssRequestingProcess.state') {
        viewHandlers[current](onChange.target(watchedState));
      }
      if (path === 'feeds') {
        viewHandlers.feeds(onChange.target(watchedState));
      }
      if (path === 'posts') {
        viewHandlers.posts(onChange.target(watchedState));
        const postsLinks = document.querySelectorAll('.posts a');
        postsLinks.forEach((link) => link.addEventListener('click', (e) => {
          e.target.classList.remove('fw-bold');
          e.target.classList.add('fw-normal', 'link-secondary');
          const post = find(watchedState.posts, { id: Number(e.target.dataset.id) });
          post.visited = true;
        }));
      }
    });

    viewHandlers.initial(locales, state);

    const feedsUpdate = () => {
      // console.log('feeds update start');
      const feeds = onChange.target(watchedState.feeds);
      // console.log('feedsupdate feeds', feeds);
      if (feeds.length > 0) {
        feeds.forEach(({ link: url, id }) => {
          axios
            .get(
              `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(
                url,
              )}`,
            )
            .then((response) => schema.validate({ status: response.status, response }))
            .then(({ response }) => {
              const postByFeedId = onChange
                .target(watchedState.posts)
                .filter((elem) => elem.feedId === id);
              const { items } = rssParser(response.data.contents);
              items.forEach(({ title, link, description }) => {
                if (!find(postByFeedId, { title })) {
                  watchedState.posts.push({
                    title,
                    link,
                    description,
                    feedId: id,
                    id: watchedState.posts.length,
                    visited: false,
                  });
                }
              });
            });
        });
      }
      return setTimeout(feedsUpdate, 5000);
    };

    feedsUpdate();

    const form = document.querySelector('form');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const inputValue = event.target.elements.url.value;

      // console.log('inout value', inputValue);

      schema
        .validate({ url: inputValue })
        .then(({ url }) => {
          // watchedState.formState = 'requesting';
          if (find(watchedState.feeds, { link: url })) {
            // watchedState.feedbackMessage = locales('feedback.urlExists');
            // watchedState.formState = 'urlExists';
            // watchedState.errors.push(e);
            // watchedState.rssRequestingProcess.state = 'error';

            // return;
            throw new Error('urlExists');
          }

          watchedState.rssRequestingProcess.state = 'requesting';
          return axios.get(
            `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(
              url,
            )}`,
          );
        })
      // .then((response) => schema.validate({ rss: response.data.contents, response }))
      // .then(({ response }) => {
        .then((response) => {
          // console.log('sucsees');
          // console.log(response);
          // const { feed, posts } = rssParser(response.data);

          // const { title, description, items } = rssParser(response.data.contents);
          const feed = rssParser(response.data.contents);

          const feedId = watchedState.feeds.length;
          // console.log('feedId', feedId);

          watchedState.feeds.push({
            title: feed.title,
            description: feed.description,
            link: inputValue,
            id: feedId,
          });

          // console.log('itmes statrt');

          feed.items.forEach(({ title, link, description }) => watchedState.posts.push({
            title,
            link,
            description,
            feedId,
            id: watchedState.posts.length,
            visited: false,
          }));

          watchedState.errors = [];
          // watchedState.feedbackMessage = locales('feedback.success');
          watchedState.rssRequestingProcess.state = 'success';
        })
        .catch((e) => {
          watchedState.errors.push(e);
          // console.log('error message', e.message);
          // console.log('error message test', e.test);
          // console.log('e name', e.name);

          // console.log('error', JSON.stringify(e));

          // if (/Network Error/g.exec(e)) {
          //   // watchedState.feedbackMessage = locales('feedback.networkError');
          //   // watchedState.formState = 'networkError';
          //   watchedState.rssRequestingProcess.errors.push({ errorType: 'networkError' });
          //   watchedState.rssRequestingProcess.state = 'error';
          //   return;
          // }

          watchedState.feedbackMessage = e.message.value;
          watchedState.rssRequestingProcess.state = 'error';
          // watchedState.formState = e.message;
        });
    });

    const modal = document.querySelector('.modal');
    modal.addEventListener('show.bs.modal', (e) => {
      const clickedButtonId = Number(e.relatedTarget.getAttribute('data-id'));
      const clickedPost = find(watchedState.posts, { id: clickedButtonId });
      clickedPost.visited = true;
      viewHandlers.modal(clickedPost);
    });
  });
