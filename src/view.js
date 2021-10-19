const initialHandler = (locales) => {
  document.querySelector('h1').textContent = locales('title');
  document.querySelector('.lead').textContent = locales('lead');
  document.querySelector('#url-input ~ label').textContent = locales('form.inputLabel');
  document.querySelector('form button').textContent = locales('form.button');
  document.querySelector('form ~ p').textContent = locales('sampleUrl');
  document.querySelector('.modal-footer button').textContent = locales('modal.closeButton');
  document.querySelector('.full-article').textContent = locales('modal.readButton');
  const footerLink = document.querySelector('footer a');
  footerLink.textContent = locales('footer.link');
  footerLink.parentElement.childNodes[0].nodeValue = locales('footer.text');
};

const renderPopup = (state) => {
  const {
    uiState: {
      popup: { postId },
    },
    posts,
  } = state;

  const [postData] = posts.filter((post) => post.id === postId);
  const {
    title, description, link, id,
  } = postData;

  document.querySelector('.modal-title').textContent = title;
  document.querySelector('.modal-body').textContent = description;
  document.querySelector('.full-article').href = link;

  const a = document.querySelector(`[data-id="${id}"]`);
  a.classList.remove('fw-bold');
  a.classList.add('fw-normal', 'link-secondary');
};

const invalidHandler = () => {
  const input = document.querySelector('input');
  input.classList.add('is-invalid');
  input.removeAttribute('readonly');
  input.disabled = false;

  const button = document.querySelector('[name="add"]');
  button.disabled = false;
  button.removeAttribute('readonly');
};

const validHandler = (message) => {
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
  feedback.textContent = `${message}`;
  feedback.classList.add('text-success');
  feedback.classList.remove('text-danger');
};

const requestingHandler = (message) => {
  const input = document.querySelector('input');
  input.classList.remove('is-invalid');
  input.disabled = true;
  input.setAttribute('readonly', '');

  const button = document.querySelector('[name="add"]');
  button.setAttribute('readonly', '');
  button.disabled = true;

  const feedback = document.querySelector('.feedback');
  feedback.textContent = `${message}`;
  feedback.classList.remove('text-success');
  feedback.classList.remove('text-danger');
};

const markVisitedPosts = (visitedPostsIds) => {
  visitedPostsIds.forEach((id) => {
    const post = document.querySelector(`[data-id="${id}"]`);
    post.classList.add('fw-nomal', 'link-secondary');
    post.classList.remove('fw-bold');
  });
};

const makeCard = (title) => {
  const card = document.createElement('div');
  card.classList.add('card', 'border-0');

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');

  const cardBodyHeader = document.createElement('h2');
  cardBodyHeader.classList.add('card-title', 'h4');
  cardBodyHeader.textContent = `${title}`;

  cardBody.appendChild(cardBodyHeader);
  card.appendChild(cardBody);
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
  const header = document.createElement('h3');
  header.classList.add('h6', 'm-0');
  header.textContent = title;

  const p = document.createElement('p');
  p.classList.add('m-0', 'small', 'text-black-50');
  p.textContent = description;
  li.appendChild(header);
  li.appendChild(p);
  return li;
};

const renderFeeds = (feeds, feedsTexts) => {
  const feedsBlock = document.querySelector('.feeds');
  feedsBlock.innerHTML = '';
  if (feeds.length === 0) return;
  feedsBlock.appendChild(makeCard(feedsTexts.title));
  const feedsUl = makeUl();
  feeds
    .sort((a, b) => b.id - a.id)
    .forEach(({
      title, description, link, id,
    }) => {
      feedsUl.appendChild(makeFeedLi(title, description, link, id));
    });
  feedsBlock.appendChild(feedsUl);
};

const makePostsLi = (title, link, id, buttonName) => {
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
  a.classList.add('fw-bold');
  a.textContent = `${title}`;

  const button = document.createElement('button');
  button.type = 'button';
  button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  button.dataset.id = id;
  button.dataset.bsToggle = 'modal';
  button.dataset.bsTarget = '#exampleModal';
  button.textContent = buttonName;

  li.appendChild(a);
  li.appendChild(button);
  return li;
};

const renderPosts = (posts, postsTexts, postsUI) => {
  const postsBlock = document.querySelector('.posts');
  postsBlock.textContent = '';
  if (posts.length === 0) return;
  postsBlock.appendChild(makeCard(postsTexts.title));
  const postsUl = makeUl();
  posts
    .sort((a, b) => b.feedId - a.feedIdb)
    .forEach(({ title, link, id }) => {
      postsUl.appendChild(makePostsLi(title, link, id, postsTexts.previewButton));
    });
  postsBlock.appendChild(postsUl);
  markVisitedPosts(postsUI);
};

const showErrorMessage = (errorMessage) => {
  const feedback = document.querySelector('.feedback');
  feedback.textContent = `${errorMessage}`;
  feedback.classList.remove('text-success');
  feedback.classList.add('text-danger');
};

const handleErrors = (errors, errorTexts) => {
  const error = errors[errors.length - 1];
  switch (true) {
    case !!/Net/g.exec(error):
      showErrorMessage(errorTexts.networkError);
      break;
    case !!/invalidRSS/g.exec(error):
      showErrorMessage(errorTexts.invalidRSS);
      break;
    case !!/urlExists/g.exec(error):
      showErrorMessage(errorTexts.urlExists);
      break;
    case !!/invalidURL/g.exec(error):
      showErrorMessage(errorTexts.invalidURL);
      break;
    case !!/emptyInput/g.exec(error):
      showErrorMessage(errorTexts.invalidURL);
      break;
    default:
      showErrorMessage('unknown errors');
      console.error(error);
  }
};

export default (watchedState, path, current, locales) => {
  if (/errors/g.exec(path)) {
    if (current.length === 0) return;
    const errorsTexts = {
      invalidURL: locales('errors.invalidURL'),
      urlExists: locales('errors.urlExists'),
      invalidRSS: locales('errors.invalidRSS'),
      networkError: locales('errors.networkError'),
    };
    handleErrors(current, errorsTexts);
  }

  if (path === 'form.validationState') {
    if (current === 'initial') {
      initialHandler(locales);
    }
    if (current === 'invalid') {
      invalidHandler();
    }
  }

  if (path === 'requestingProcess.state') {
    if (current === 'success') {
      validHandler(locales('feedback.success'));
    }
    if (current === 'requesting') {
      requestingHandler(locales('feedback.requesting'));
    }
    if (current === 'failed') {
      invalidHandler();
    }
  }

  if (path === 'feeds') {
    const feedsTexts = {
      title: locales('feeds.title'),
    };
    renderFeeds(current, feedsTexts);
  }

  if (path === 'posts') {
    const postsTexts = {
      title: locales('posts.title'),
      previewButton: locales('posts.previewButton'),
    };
    renderPosts(current, postsTexts, watchedState.uiState.visitedPosts);
  }

  if (path === 'uiState.visitedPosts') {
    markVisitedPosts(current);
  }

  if (path === 'uiState.popup.postId') {
    renderPopup(watchedState);
  }
};
