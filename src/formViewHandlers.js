const inValidHandler = (state) => {
  const input = document.querySelector('input');
  const button = document.querySelector('[name="add"]');
  // console.log(button);
  const feedback = document.querySelector('.feedback');
  input.classList.add('is-invalid');
  feedback.innerHTML = `${state.feedbackMessage}`;
  feedback.classList.remove('text-success');
  feedback.classList.add('text-danger');
  // input.disabled = true;
  // button.disabled = true;
  // input.setAttribute('readonly', '');
  // button.setAttribute('readonly', '');
  input.disabled = false;
  button.disabled = false;
  input.removeAttribute('readonly');
  button.removeAttribute('readonly');
};
const validHandler = (state) => {
  const input = document.querySelector('input');
  const button = document.querySelector('[name="add"]');
  const feedback = document.querySelector('.feedback');
  input.classList.remove('is-invalid');
  input.disabled = false;
  button.disabled = false;
  input.removeAttribute('readonly');
  button.removeAttribute('readonly');
  input.value = '';
  // feedback.innerHTML = 'RSS успешно загружен';
  // console.log('validHandler state', state);
  feedback.innerHTML = `${state.feedbackMessage}`;
  feedback.classList.add('text-success');
  feedback.classList.remove('text-danger');
};

const requestingHAndler = () => {
  const input = document.querySelector('input');
  const button = document.querySelector('[name="add"]');
  const feedback = document.querySelector('.feedback');
  input.classList.remove('is-invalid');
  input.disabled = true;
  button.disabled = true;
  input.setAttribute('readonly', '');
  button.setAttribute('readonly', '');
  feedback.innerHTML = '';
};

const urlExistsHandler = (state) => {
  const input = document.querySelector('input');
  const feedback = document.querySelector('.feedback');
  input.classList.add('is-invalid');
  feedback.innerHTML = `${state.feedbackMessage}`;
  feedback.classList.remove('text-success');
  feedback.classList.add('text-danger');
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
  // console.log('renderFeeds state', state);
  const feeds = document.querySelector('.feeds');
  feeds.innerHTML = '';
  if (state.data.length === 0) return;
  feeds.appendChild(makeCard(state.title));
  const feedsUl = makeUl();
  const feedsData = state.data;

  feedsData
    .sort((a, b) => b.id - a.id)
    .forEach(({ title, description, link, id }) => {
      feedsUl.appendChild(makeFeedLi(title, description, link, id));
    });
  feeds.appendChild(feedsUl);
};

const makePostsLi = (title, description, link, id, visited, buttonsName) => {
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
  // a.addEventListener('click', (e) => {
  //   e.target.classList.remove('fw-bold');
  //   e.target.classList.add('fw-normal', 'link-secondary');
  //   console.log('a target', e.target, e.target.dataset.id);
  //   const post = _.find(watchedState.posts.data, { id: Number(e.target.dataset.id) });
  //   post.visited = true;
  //   console.log('pist find', post);
  // });
  const button = document.createElement('button');
  button.type = 'button';
  button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  button.dataset.id = id;
  button.dataset.bsToggle = 'modal';
  button.dataset.bsTarget = '#exampleModal';
  button.innerHTML = buttonsName;
  li.appendChild(a);
  li.appendChild(button);
  return li;
};

const renderPosts = (state) => {
  const posts = document.querySelector('.posts');
  posts.innerHTML = '';
  if (state.data.length === 0) return;
  posts.appendChild(makeCard(state.title));
  const postsUl = makeUl();
  const postsData = state.data;
  postsData
    .sort((a, b) => b.feedId - a.feedId)
    .forEach(({ title, description, link, id, visited }) => {
      postsUl.appendChild(makePostsLi(title, description, link, id, visited, state.buttonsName));
    });
  posts.appendChild(postsUl);
};

const viewHandlers = {
  requesting() {
    // console.log('requesting handler started');
    requestingHAndler();
    return true;
  },
  success(state) {
    // console.log('success handler started');
    validHandler(state);
    return true;
  },
  urlExists(state) {
    // console.log('urlExists handler started');
    urlExistsHandler(state);
    return true;
  },
  invalidURL(message) {
    // console.log('invalidInput handler started');
    // console.log('invalid state message', message, errors);
    inValidHandler(message);
    return true;
  },
  invalidRSS(message) {
    console.log('invalidRss handler started');
    // console.log('invalid state message', message, errors);
    inValidHandler(message);
    return true;
  },
  networkError(message) {
    inValidHandler(message);
  },
  inputting() {
    // console.log('inputting handler started');
    inputtingHandler();
    return true;
  },
  feeds(state) {
    // console.log('feeds handler started');
    renderFeeds(state);
  },

  posts(state) {
    // console.log('posts handler started');
    renderPosts(state);
  },
};

export default viewHandlers;
