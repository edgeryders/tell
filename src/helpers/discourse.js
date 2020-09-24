import generatePassword from 'secure-random-string'

const errorMessages = {
    "networkError": "Sorry, we were unable to store your response due to a network connectivity issue. Please try clicking on \"Send\" again.",
    "username": "It seems somebody has already chosen your preferred username / nickname. Please enter a different one and click again on \"Send\".",
    "email": "It seems you already have an account on our forum using this e-mail address, or have entered an invalid address. Please choose a different e-mail address and click again on \"Send\".",
    "default": "Sorry, we were unable to store your response due to an unknown error. Please try clicking on \"Send\" again."
  }

const createUser = (form, authKey, messages) => (
  fetch(`${process.env.VUE_APP_DISCOURSE_USER_URL}?${Object.entries({
    accepted_gtc: true,
    accepted_privacy_policy: true,
    edgeryders_research_consent: true,
    requested_api_keys: [process.env.VUE_APP_DISCOURSE_DOMAIN],
    auth_key: authKey,
    email: form.account.email,
    username: form.account.username,
    password: createPassword(form)
  }).map(pair => pair.map(encodeURIComponent).join('=')).join('&')}`)
    .then(handleResponse(errorMessages), handleNetworkError(errorMessages))
)

function createPassword(form) {
  if (form.account.password !== '') {
    return form.account.password 
  } else {
    var password = generatePassword({ length: 15 });
    // window.console.log(password);
    return password
  }
}

function getPayload(response, config) {
  var payload = {
      title: config.title,
      raw: response,
      category: config.publish.category
    };
  if (config.publish.topic) {
    payload['topic_id'] = config.publish.topic
  }
  var payload_json = JSON.stringify(payload);
  // window.console.log(payload);
  // window.console.log(payload_json)
  return payload_json
}

function createTopic(response, json, messages, config) {
  // window.console.log(json);
  var apiKey = json.api_keys[0].key;
  // window.console.log(apiKey);
  fetch(process.env.VUE_APP_DISCOURSE_TOPIC_URL, {
    method: 'post',
    headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: getPayload(response, config)
  }).then(handleResponse(messages), handleNetworkError(messages))
}

const handleResponse = messages => (
  response => (
    response.ok
      ? response.json()
      : response.json().then(({ errors }) => (
        Promise.reject(Object.keys(errors).map(key => (
          messages[key] || messages.default
        )))
      )
    )
  )
)

const handleNetworkError = messages => (
  () => Promise.reject([messages.networkError])
)

export default (form, response, messages, config) => (
  createUser(form, process.env.VUE_APP_DISCOURSE_AUTH_KEY, messages).then(json => (
    createTopic(response, json, messages, config)
  ))
)
