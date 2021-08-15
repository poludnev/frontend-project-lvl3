import _ from 'lodash';
import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import viewHandlers from './viewHandlers.js';
import rssParser from './rssParser.js';
import ru from './locales/ru.js';
import 'bootstrap/dist/js/bootstrap.min.js';

export default () => {
  const i18nInstance2 = i18next.createInstance();

  i18nInstance2
    .init({
      lng: 'ru',
      resources: {
        ru,
      },
    })
    .then((locales) => {
      yup.setLocale({
        string: {
          url: () => ({
            name: 'invalidURL',
            value: locales('feedback.invalidInput'),
          }),
          matches: () => ({ name: 'invalidRSS', value: locales('feedback.invalidRSS') }),
        },
      });

      const schema = yup.object().shape({
        url: yup.string().url(),
        rss: yup.string().matches(/<rss /),
        status: yup.number().min(200).max(200),
      });

      const state = {
        formState: 'initial',
        feedbackMessage: '',
        errors: [],
        feeds: {
          title: locales('feedsTitle'),
          lastsIndex: 0,
          data: [],
          addFeed(newFeed) {
            this.data.push({ ...newFeed, id: this.lastsIndex });
            this.lastsIndex += 1;
          },
        },
        posts: {
          title: locales('posts.title'),
          buttonsName: locales('posts.button'),
          lastsIndex: 0,
          data: [],
          addPost(newPost) {
            this.data.push({ ...newPost, id: this.lastsIndex, visited: false });
            this.lastsIndex += 1;
          },
        },
      };

      const watchedState = onChange(state, (path, current) => {
        // console.log('watchedState', path);
        if (path === 'formState') {
          viewHandlers[current](onChange.target(watchedState));
        }
        if (path === 'feeds') {
          viewHandlers.feeds(current);
        }
        if (path === 'posts') {
          viewHandlers.posts(current);
          const postsLinks = document.querySelectorAll('.posts a');
          postsLinks.forEach((link) => link.addEventListener('click', (e) => {
            e.target.classList.remove('fw-bold');
            e.target.classList.add('fw-normal', 'link-secondary');
            const post = _.find(watchedState.posts.data, { id: Number(e.target.dataset.id) });
            post.visited = true;
          }));
        }
      });

      viewHandlers.initial(locales);

      const feedsUpdate = () => {
        const feeds = onChange.target(watchedState.feeds.data);
        if (feeds.length > 0) {
          feeds.forEach(({ link, id }) => {
            axios
              .get(
                `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(
                  link,
                )}`,
              )
              .then((response) => schema.validate({ status: response.status, response }))
              .then(({ response }) => {
                const postByFeedId = onChange
                  .target(watchedState.posts.data)
                  .filter((elem) => elem.feedId === id);
                const { posts } = rssParser(response.data);
                posts.forEach((post) => {
                  if (!_.find(postByFeedId, { title: post.title })) {
                    watchedState.posts.addPost({
                      title: post.title,
                      link: post.link,
                      description: post.description,
                      feedId: id,
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

        if (_.find(watchedState.feeds.data, { link: inputValue })) {
          watchedState.feedbackMessage = locales('feedback.urlExists');
          watchedState.formState = 'urlExists';
          return;
        }

        schema
          .validate({ url: inputValue })
          .then(({ url }) => {
            watchedState.formState = 'requesting';
            return axios.get(
              `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(
                url,
              )}`,
            );
          })
          .then((response) => schema.validate({ rss: response.data.contents, response }))
          .then(({ response }) => {
            const { feed, posts } = rssParser(response.data);
            // const { feed, posts } = parsedRss;

            watchedState.feeds.addFeed({ ...feed, link: inputValue });

            posts.forEach(({ title, link, description }) => watchedState.posts.addPost({
              title,
              link,
              description,
              feedId: watchedState.feeds.lastsIndex - 1,
            }));

            watchedState.errors = [];
            watchedState.feedbackMessage = locales('feedback.success');
            watchedState.formState = 'success';
          })
          .catch((e) => {
            watchedState.errors.push(e);
            if (/Network Error/g.exec(e)) {
              watchedState.feedbackMessage = locales('feedback.networkError');
              watchedState.formState = 'networkError';
              return;
            }
            watchedState.feedbackMessage = e.errors[0].value;
            watchedState.formState = e.errors[0].name;
          });
      });

      const modal = document.querySelector('.modal');
      modal.addEventListener('show.bs.modal', (e) => {
        const clickedButtonId = Number(e.relatedTarget.getAttribute('data-id'));
        const clickedPost = _.find(watchedState.posts.data, { id: clickedButtonId });
        clickedPost.visited = true;
        viewHandlers.modal(clickedPost);
      });
    });
};
