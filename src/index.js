import _ from 'lodash';
import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import viewHandlers from './formViewHandlers.js';
import rssParser from './rssParser.js';
import ru from './locales/ru.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';

// const httpRequest = (url) =>
//   axios.get(`https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}`);

// const isValidRespond = (response) => {
//   if (response.status === 200) return true;
//   return false;
// };

// const isValidInput = (inputValue) => schema.isValid({ url: inputValue });

const isUrlExists = (url, state) => {
  // console.log('is url exist, state:', state.feeds);
  const x = _.find(state.feeds.data, { link: url });
  // console.log('is url exist', x);
  if (x) return true;
  return false;
};

const runApp = async () => {
  console.log('app started');

  const i18nInstance = i18next.createInstance();

  await i18nInstance.init({
    lng: 'ru',
    resources: {
      ru,
    },
  });

  yup.setLocale({
    string: {
      url: () => ({
        name: 'invalidURL',
        value: i18nInstance.t('feedback.invalidInput'),
      }),
      // matcches: i18nInstance.t('feedback.invalidRSS'),
      matches: () => ({ name: 'invalidRSS', value: i18nInstance.t('feedback.invalidRSS') }),
    },
  });

  const schema = yup.object().shape({
    url: yup.string().url(),
    rss: yup.string().matches(/<rss /),
  });

  const state = {
    formState: 'initial',
    feedbackMessage: '',
    errors: [],
    listData: [],
    feeds: {
      title: i18nInstance.t('feedsTitle'),
      lastsIndex: 0,
      data: [],
      addFeed(newFeed) {
        this.data.push({ ...newFeed, id: this.lastsIndex });
        this.lastsIndex += 1;
      },
    },
    posts: {
      title: i18nInstance.t('posts.title'),
      buttonsName: i18nInstance.t('posts.button'),
      lastsIndex: 0,
      data: [],
      addPost(newPost) {
        this.data.push({ ...newPost, id: this.lastsIndex, visited: false });
        this.lastsIndex += 1;
      },
    },
  };

  const watchedState = onChange(state, (path, current, previous) => {
    console.log('watchedState changes', path);
    if (path === 'formState') {
      console.log('formState changed', `path: ${path}, current: ${current}, previous: ${previous}`);

      // console.log('onchange target', onChange.target(watchedState.errors));
      // console.log('onchange target', onChange.target(watchedState.errors[0].message));

      //   console.log('watchedState invale changes', watchedState.errors);
      //   console.log(watchedState.errors);
      //   const errors = [...watchedState.errors];
      //   console.log('errors', errors, this.errors);
      //   // console.log;
      // viewHandlers[current](onChange.target(watchedState.errors[0].message));
      viewHandlers[current](onChange.target(watchedState));

      // if (path === 'errors') {
      //   console.log('path = errors', [...current]);
      //   const err = [...current];
      //   console.log('err', err[0]);
      // }
    }
    if (path === 'feeds') {
      // console.log('feeds changed');
      viewHandlers.feeds(current);
    }
    if (path === 'posts') {
      // console.log('posts changed');
      viewHandlers.posts(current);
    }
  });

  const h1 = document.querySelector('h1');
  h1.innerHTML = i18nInstance.t('title');
  const lead = document.querySelector('.lead');
  lead.innerHTML = i18nInstance.t('lead');

  const inputLabel = document.querySelector('#url-input ~ label');
  inputLabel.innerHTML = i18nInstance.t('form.inputLabel');

  const inputButton = document.querySelector('form button');
  inputButton.innerHTML = i18nInstance.t('form.button');

  const sampleUrl = document.querySelector('form ~ p');
  sampleUrl.innerHTML = i18nInstance.t('sampleUrl');

  const footerLink = document.querySelector('footer a');
  footerLink.innerHTML = i18nInstance.t('footer.link');
  const footerText = footerLink.parentElement;
  footerText.childNodes[0].nodeValue = i18nInstance.t('footer.text');
  // console.log(document.querySelector('footer'));
  // console.log(footerText.childNodes);

  const form = document.querySelector('form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const inputValue = event.target.url.value;
    // console.log('inputValue:', inputValue);
    // console.log('yup test', await schema.isValid({ url: inputValue }));

    if (isUrlExists(inputValue, watchedState)) {
      // case4: existing URL
      watchedState.feedbackMessage = i18nInstance.t('feedback.urlExists');
      watchedState.formState = 'urlExists';
      return;
    }

    schema
      .validate({ url: inputValue })
      .then(({ url }) => {
        console.log('schema validation', url);

        return axios.get(
          `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}`,
        );
        // .then((data) => {
        //   console.log('aftera axios2222', data);
        // });
      })

      .then((httpResponse) => {
        console.log('aftera axios', httpResponse);
        return (
          schema
            // .validate({ rss: httpResponse.data.status['content_type'] })
            .validate({ rss: httpResponse.data.contents, httpResponse })
        );
        // .then((data) => console.log('rss validaye', data))
        // .catch((e) => {
        // console.log('rss validation error', e);
        // watchedState.errors.push(e);
        // watchedState.formState = 'invalidInput';
        // });

        // const parsedRss = rssParser(httpResponse.data);
        // console.log('parsed rss', parsedRss);
      })
      .then(({ httpResponse }) => {
        console.log('rss valid', httpResponse);
        const parsedRss = rssParser(httpResponse.data);
        console.log('parsed rss', parsedRss);
        // case5: success
        // console.log('resonse data', response.data);
        // watchedState.listData.push(response.data);

        const { feed, posts } = parsedRss;

        watchedState.feeds.addFeed(feed);

        posts.forEach(({ title, link, description }) => watchedState.posts.addPost({
          title,
          link,
          description,
          feedId: watchedState.feeds.lastsIndex - 1,
        }));

        watchedState.errors = [];
        watchedState.feedbackMessage = i18nInstance.t('feedback.success');
        watchedState.formState = 'success';
      })
      .catch((e) => {
        // console.log('schema validation error', e);
        // console.log('schema validation error', e.name);
        // console.log('schema validation error', e.errors);

        watchedState.errors.push(e);
        // watchedState.errors.push(e);
        watchedState.feedbackMessage = e.errors[0].value;
        watchedState.formState = e.errors[0].name;
      });

    // isValidInput(inputValue).then((data) => {
    //   console.log('promise isValidInput', data);
    //   // if (!data) {
    //   //   watchedState.formState = 'invalidInput';
    //   //   return;
    //   // }

    //   watchedState.formState = 'requesting';
    //   httpRequest(inputValue).then((response) => {
    //     console.log('http response', response);
    //     if (isValidRespond(response)) {
    //       // case5: success
    //       watchedState.formState = 'success';
    //       // console.log('resonse data', response.data);
    //       watchedState.listData.push(response.data);

    //       const { feed, posts } = rssParser(response.data);

    //       watchedState.feeds.addFeed(feed);

    // posts.forEach(({ title, link, description }) =>
    //   watchedState.posts.addPost({
    //     title,
    //     link,
    //     description,
    //     feedId: watchedState.feeds.lastsIndex - 1,
    //   }),
    // );
    //     }
    //   });
    // });

    // if (await isValidInput(inputValue)) {
    //   // console.log('input string is valid url');

    //   // if (isUrlExists(inputValue, watchedState)) {
    //   //   // case4: existing URL
    //   //   watchedState.formState = 'urlExists';
    //   //   // console.log('case4 url exists, watchedState:', watchedState);
    //   //   return;
    //   // }

    //   // case2: valid url, reqeust
    //   watchedState.formState = 'requesting';
    //   // console.log('case2 request, watchedState:', watchedState);
    //   const response = await httpRequest(inputValue);

    //   if (isValidRespond(response)) {
    //     // case5: success
    //     watchedState.formState = 'success';
    //     // console.log('resonse data', response.data);
    //     watchedState.listData.push(response.data);

    //     const { feed, posts } = rssParser(response.data);

    //     watchedState.feeds.addFeed(feed);

    //     posts.forEach(({ title, link, description }) =>
    //       watchedState.posts.addPost({
    //         title,
    //         link,
    //         description,
    //         feedId: watchedState.feeds.lastsIndex - 1,
    //       }),
    //     );

    //     return;
    //   }
    //   console.log('checking response: not succeed');
    // }
    // case3: invalid input
    // watchedState.formState = 'invalidInput';
  });
  const modal = document.querySelector('.modal');
  modal.addEventListener('show.bs.modal', (e) => {
    const button = e.relatedTarget;
    const buttonId = Number(button.getAttribute('data-id'));
    const modalTitle = document.querySelector('.modal-title');
    const post = _.find(watchedState.posts.data, { id: buttonId });
    modalTitle.innerHTML = post.title;
    const modalBody = document.querySelector('.modal-body');
    modalBody.innerHTML = post.description;
    const fullArticle = document.querySelector('.full-article');
    fullArticle.href = post.link;
    fullArticle.textContent = i18nInstance.t('modal.readButton');
    const closeButton = document.querySelector('.modal-footer button');
    closeButton.textContent = i18nInstance.t('modal.closeButton');
  });
};

runApp();
