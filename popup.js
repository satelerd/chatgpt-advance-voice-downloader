document.addEventListener('DOMContentLoaded', function() {
  const messageIdInput = document.getElementById('message_id');
  const conversationIdInput = document.getElementById('conversation_id');
  const voiceSelect = document.getElementById('voice');
  const tokenInput = document.getElementById('token');
  const downloadForm = document.getElementById('downloadForm');
  const downloadButton = document.getElementById('downloadButton');
  const statusMessage = document.getElementById('statusMessage');

  // Poblar el select de voces
  const voices = ['Cove', 'Breeze', 'Ember', 'Juniper'];
  voices.forEach(voice => {
    const option = document.createElement('option');
    option.value = voice.toLowerCase();
    option.textContent = voice;
    voiceSelect.appendChild(option);
  });

  // Cargar el token guardado, si existe
  chrome.storage.sync.get(['token'], function(result) {
    if (chrome.runtime.lastError) {
      console.error('Error al cargar el token:', chrome.runtime.lastError);
      return;
    }
    if (result.token) {
      tokenInput.value = result.token;
    }
  });

  downloadForm.addEventListener('submit', function(event) {
    event.preventDefault();
    downloadButton.disabled = true;
    showStatus('Descargando...', 'info');

    const messageId = messageIdInput.value.trim();
    const conversationId = conversationIdInput.value.trim();
    const voice = voiceSelect.value;
    const token = tokenInput.value.trim();

    if (!messageId || !conversationId || !voice || !token) {
      showStatus('Por favor, complete todos los campos.', 'error');
      downloadButton.disabled = false;
      return;
    }

    // Guardar el token para futuros usos
    chrome.storage.sync.set({token: token}, function() {
      if (chrome.runtime.lastError) {
        console.error('Error al guardar el token:', chrome.runtime.lastError);
      } else {
        console.log('Token guardado');
      }
    });

    const url = `https://chatgpt.com/backend-api/synthesize?message_id=${messageId}&conversation_id=${conversationId}&voice=${voice}&format=aac`;

    console.log('URL de la solicitud:', url);

    fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*'
      }
    })
    .then(response => {
      console.log('Respuesta recibida:', response);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return response.blob();
    })
    .then(blob => {
      console.log('Blob recibido:', blob);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `audio_${conversationId}.aac`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      showStatus('Descarga completada con éxito.', 'success');
    })
    .catch(error => {
      console.error('Error:', error);
      showStatus(`Error al descargar el audio: ${error.message}`, 'error');
    })
    .finally(() => {
      downloadButton.disabled = false;
    });
  });

  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-card ${type}`;
  }
});