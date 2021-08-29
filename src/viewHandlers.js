const formValidHandler = () => {};

const initialHandler = (locales, state) => {
  console.log('initial handler statew', state);
  document.querySelector('h1').innerHTML = locales('title');
  document.querySelector('.lead').innerHTML = locales('lead');
  document.querySelector('#url-input ~ label').innerHTML = locales('form.inputLabel');
  document.querySelector('form button').innerHTML = locales('form.button');
  document.querySelector('form ~ p').innerHTML = locales('sampleUrl');
  document.querySelector('.modal-footer button').textContent = locales('modal.closeButton');
  document.querySelector('.full-article').textContent = locales('modal.readButton');
  const footerLink = document.querySelector('footer a');
  footerLink.innerHTML = locales('footer.link');
  footerLink.parentElement.childNodes[0].nodeValue = locales('footer.text');
  console.log('initial handler finish');
};

const modalHandler = (post) => {
  document.querySelector('.modal-title').innerHTML = post.title;
  document.querySelector('.modal-body').innerHTML = post.description;
  document.querySelector('.full-article').href = post.link;

  const a = document.querySelector(`[data-id="${post.id}"]`);
  a.classList.remove('fw-bold');
  a.classList.add('fw-normal', 'link-secondary');
};

const invalidHandler = (state) => {
  const input = document.querySelector('input');
  input.classList.add('is-invalid');
  input.removeAttribute('readonly');
  input.disabled = false;

  const button = document.querySelector('[name="add"]');
  button.disabled = false;
  button.removeAttribute('readonly');

  const feedback = document.querySelector('.feedback');
  feedback.innerHTML = `${state.feedbackMessage}`;
  feedback.classList.remove('text-success');
  feedback.classList.add('text-danger');
};

const validHandler = (state) => {
  console.log('valid handler state', state);
  const input = document.querySelector('input');
  input.removeAttribute('readonly');
  input.classList.remove('is-invalid');
  input.disabled = false;
  input.value = '';
  input.focus();

  const button = document.querySelector('[name="add"]');
  button.disabled = false;
  button.removeAttribute('readonly');

  const feedback = document.querySelector('.feedback');
  feedback.innerHTML = `${state.texts.successMessage}`;
  feedback.classList.add('text-success');
  feedback.classList.remove('text-danger');
};

const requestingHandler = () => {
  const input = document.querySelector('input');
  input.classList.remove('is-invalid');
  input.disabled = true;
  input.setAttribute('readonly', '');

  const button = document.querySelector('[name="add"]');
  button.setAttribute('readonly', '');
  button.disabled = true;

  const feedback = document.querySelector('.feedback');
  feedback.innerHTML = '';
};

const makeCard = (title) => {
  const card = document.createElement('div');
  card.classList.add('card', 'border-0');
  card.innerHTML = `<div class="card-body"><h2 class="card-title h4">${title}</h2></div>`;
  return card;
};

const makeUl = () => {
  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');
  return ul;
};

const makeFeedLi = (title, description) => {
  const li = document.createElement('li');
  li.classList.add('list-group-item', 'border-0', 'border-end-0');
  const h3 = document.createElement('h3');
  h3.classList.add('h6', 'm-0');
  h3.innerHTML = title;

  const p = document.createElement('p');
  p.classList.add('m-0', 'small', 'text-black-50');
  p.innerHTML = description;
  li.appendChild(h3);
  li.appendChild(p);
  return li;
};

const renderFeeds = (state) => {
  console.log('feeds render state', state);
  const feeds = document.querySelector('.feeds');
  feeds.innerHTML = '';
  if (state.feeds.length === 0) return;
  feeds.appendChild(makeCard(state.texts.feeds));
  const feedsUl = makeUl();
  const feedsData = state.feeds;

  feedsData
    .sort((a, b) => b.id - a.id)
    .forEach(({ title, description, link, id }) => {
      feedsUl.appendChild(makeFeedLi(title, description, link, id));
    });
  feeds.appendChild(feedsUl);
};

const makePostsLi = (title, link, id, visited, buttonName) => {
  const li = document.createElement('li');
  li.classList.add(
    'list-group-item',
    'd-flex',
    'justify-content-between',
    'align-items-start',
    'border-0',
    'border-end-0',
  );
  const a = document.createElement('a');
  a.href = `${link}`;
  a.dataset.id = id;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  if (visited) {
    a.classList.add('fw-nomal', 'link-secondary');
  } else {
    a.classList.add('fw-bold');
  }

  a.innerHTML = `${title}`;
  const button = document.createElement('button');
  button.type = 'button';
  button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  button.dataset.id = id;
  button.dataset.bsToggle = 'modal';
  button.dataset.bsTarget = '#exampleModal';
  button.innerHTML = buttonName;

  li.appendChild(a);
  li.appendChild(button);
  return li;
};

const renderPosts = (state) => {
  const posts = document.querySelector('.posts');
  posts.innerHTML = '';
  if (state.length === 0) return;
  posts.appendChild(makeCard(state.texts.posts));
  const postsUl = makeUl();
  const postsData = state.posts;
  postsData
    .sort((a, b) => b.feedId - a.feedId)
    .forEach(({ title, link, id, visited }) => {
      postsUl.appendChild(makePostsLi(title, link, id, visited, state.texts.postButton));
    });
  posts.appendChild(postsUl);
};

const showErrorMessage = (errorMessage) => {
  const feedback = document.querySelector('.feedback');
  feedback.innerHTML = `${errorMessage}`;
  feedback.classList.remove('text-success');
  feedback.classList.add('text-danger');
};

const erorrHandler = (state) => {
  console.log('error handler state', state);
  console.log('error mmessage', state.errors[state.errors.length - 1]);
  const error = state.errors[state.errors.length - 1];
  console.log('regex', /Network Error/g.exec(error));
  // success: 'RSS успешно загружен',
  //     urlExists: 'RSS уже существует',
  //     invalidInput: 'Ссылка должна быть валидным URL',
  //     invalidRSS: 'Ресурс не содержит валидный RSS',
  //     networkError: 'Ошибка сети',
  switch (true) {
    case !!/Network Error/g.exec(error):
      console.log('network erorr');
      showErrorMessage(state.texts.errors.networkError);
      break;
    case !!/invalidRSS/g.exec(error):
      console.log('invalid rss error');
      showErrorMessage(state.texts.errors.invalidRSS);
      break;
    case !!/urlExists/g.exec(error):
      console.log('urlExists error');
      showErrorMessage(state.texts.errors.urlExists);
      break;
    case !!/invalidURL/g.exec(error):
      console.log('invalid input error');
      showErrorMessage(state.texts.errors.invalidURL);
      break;
    default:
      console.log('default erors');
  }
};

const viewHandlers = {
  initial(locales, state) {
    initialHandler(locales, state);
  },
  requesting() {
    requestingHandler();
  },
  success(state) {
    validHandler(state);
  },
  urlExists(state) {
    invalidHandler(state);
  },
  invalidURL(state) {
    invalidHandler(state);
  },
  invalidRSS(state) {
    invalidHandler(state);
  },
  networkError(state) {
    invalidHandler(state);
  },
  feeds(state) {
    renderFeeds(state);
  },
  posts(state) {
    renderPosts(state);
  },
  modal(post) {
    modalHandler(post);
  },
  error(state) {
    console.log('error srate', state);
    invalidHandler(state);
    erorrHandler(state);
  },
};

export default viewHandlers;
