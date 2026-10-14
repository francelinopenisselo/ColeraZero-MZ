// Script da aplicacao - Mini-Projecto Multimédia (UP-Maputo)

document.addEventListener('DOMContentLoaded', () => {
  // Estado geral
  const state = {
    currentScreen: 1,
    totalScreens: 5,
    isSpeaking: false,
    synth: window.speechSynthesis || null,
    currentUtterance: null,
    audioCtx: null,
    handWashTimer: null,
    handWashTimeLeft: 20,
    supabaseClient: null
  };

  // Inicializacao do Supabase com fallback seguro
  const supabaseBadge = document.getElementById('supabaseStatusBadge');

  function initSupabase() {
    try {
      const config = window.SUPABASE_CONFIG;
      if (window.supabase && config && config.url && config.anonKey && config.url.trim() !== '' && config.anonKey.trim() !== '') {
        state.supabaseClient = window.supabase.createClient(config.url.trim(), config.anonKey.trim());
        if (supabaseBadge) {
          supabaseBadge.textContent = 'Supabase Ativo';
          supabaseBadge.classList.add('connected');
        }
      } else {
        if (supabaseBadge) {
          supabaseBadge.textContent = 'Modo Local';
          supabaseBadge.classList.remove('connected');
        }
      }
    } catch (err) {
      if (supabaseBadge) {
        supabaseBadge.textContent = 'Modo Local';
      }
    }
  }

  initSupabase();

  // Textos dos ecrãs para leitura em áudio
  const narrationScripts = {
    1: "Bem-vindos à aplicação sobre prevenção da cólera e cuidados com a água no dia a dia em Moçambique. Um guia comunitário desenvolvido na Universidade Pedagógica de Maputo.",
    2: "Ecrã dois: O desafio sanitário em Moçambique. Os surtos ocorrem principalmente após ciclones e épocas chuvosas devido ao consumo de poços desprotegidos. A bactéria Vibrio cholerae causa diarreia aquosa aguda e desidratação rápida. Por isso, a informação por áudio e imagem é essencial para todas as comunidades.",
    3: "Ecrã três: Os três passos de prevenção. Primeiro, tratar a água por fervura de um a três minutos ou com uma tampa de produto Certeza para cada balde de vinte litros, aguardando trinta minutos. Segundo, conservar sempre em balde fechado e limpo. Terceiro, lavar as mãos com sabão ou cinza durante vinte segundos.",
    4: "Ecrã quatro: Quiz comunitário. Pergunta: Como deve ser tratada a água de um poço aberto antes de beber? Escolha uma das três opções para verificar a resposta correta.",
    5: "Ecrã cinco: Conclusão. Parabéns por concluir o guia comunitário. Lembre-se: água tratada, balde fechado e mãos lavadas salvam vidas."
  };

  // Sons de feedback com AudioContext
  function getAudioContext() {
    if (!state.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        state.audioCtx = new AudioContextClass();
      }
    }
    if (state.audioCtx && state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }
    return state.audioCtx;
  }

  function playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.2) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio nao suportado
    }
  }

  function playSuccessChime() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          playTone(freq, 'triangle', 0.35, 0.25);
        }, idx * 110);
      });
    } catch (e) {}
  }

  function playErrorAlert() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      playTone(280, 'sawtooth', 0.22, 0.2);
      setTimeout(() => {
        playTone(220, 'sawtooth', 0.35, 0.25);
      }, 150);
    } catch (e) {}
  }

  function playClick() {
    playTone(800, 'sine', 0.05, 0.08);
  }

  // Leitura de texto por voz
  const audioNarratorBtn = document.getElementById('audioNarratorBtn');
  const narratorStatusText = document.getElementById('narratorStatusText');

  function stopNarration() {
    if (state.synth) {
      state.synth.cancel();
    }
    state.isSpeaking = false;
    if (audioNarratorBtn) {
      audioNarratorBtn.classList.remove('speaking');
    }
    if (narratorStatusText) {
      narratorStatusText.textContent = 'Ouvir';
    }
  }

  function speakText(text) {
    if (!state.synth) {
      showToast('Síntese de voz não disponível no navegador.');
      return;
    }

    stopNarration();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-PT';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = state.synth.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith('pt'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onstart = () => {
      state.isSpeaking = true;
      if (audioNarratorBtn) audioNarratorBtn.classList.add('speaking');
      if (narratorStatusText) narratorStatusText.textContent = 'Pausar';
    };

    utterance.onend = () => {
      stopNarration();
    };

    utterance.onerror = () => {
      stopNarration();
    };

    state.currentUtterance = utterance;
    state.synth.speak(utterance);
  }

  function toggleCurrentNarration() {
    if (state.isSpeaking) {
      stopNarration();
    } else {
      const script = narrationScripts[state.currentScreen];
      if (script) {
        speakText(script);
      }
    }
  }

  if (audioNarratorBtn) {
    audioNarratorBtn.addEventListener('click', () => {
      playClick();
      toggleCurrentNarration();
    });
  }

  // Navegacao entre ecrãs
  const screens = document.querySelectorAll('.screen-card');
  const stepIndicators = document.querySelectorAll('.step-indicator');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const footerScreenNumber = document.getElementById('footerScreenNumber');

  function goToScreen(screenNumber) {
    if (screenNumber < 1 || screenNumber > state.totalScreens) return;

    stopNarration();

    screens.forEach(screen => {
      screen.classList.remove('active');
      if (parseInt(screen.getAttribute('data-screen'), 10) === screenNumber) {
        screen.classList.add('active');
      }
    });

    stepIndicators.forEach(step => {
      const stepNum = parseInt(step.getAttribute('data-step'), 10);
      step.classList.toggle('active', stepNum === screenNumber);
    });

    state.currentScreen = screenNumber;

    if (prevBtn) {
      prevBtn.disabled = screenNumber === 1;
    }
    if (nextBtn) {
      if (screenNumber === state.totalScreens) {
        nextBtn.innerHTML = `<span>Reiniciar</span> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`;
      } else {
        nextBtn.innerHTML = `<span>Avançar</span> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
      }
    }

    if (footerScreenNumber) {
      footerScreenNumber.textContent = `${screenNumber} / ${state.totalScreens}`;
    }

    if (screenNumber === 5) {
      carregarRelatos();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      playClick();
      goToScreen(state.currentScreen - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      playClick();
      if (state.currentScreen === state.totalScreens) {
        goToScreen(1);
      } else {
        goToScreen(state.currentScreen + 1);
      }
    });
  }

  document.querySelectorAll('[data-goto-screen]').forEach(btn => {
    btn.addEventListener('click', () => {
      playClick();
      const targetScreen = parseInt(btn.getAttribute('data-goto-screen'), 10);
      goToScreen(targetScreen);
    });
  });

  stepIndicators.forEach(indicator => {
    indicator.addEventListener('click', () => {
      playClick();
      const stepNum = parseInt(indicator.getAttribute('data-step'), 10);
      goToScreen(stepNum);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      if (state.currentScreen < state.totalScreens) {
        goToScreen(state.currentScreen + 1);
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      if (state.currentScreen > 1) {
        goToScreen(state.currentScreen - 1);
      }
    }
  });

  // Calculo de dosagem do Certeza
  const doseButtons = document.querySelectorAll('.dose-btn');
  const dosingOutput = document.getElementById('dosingOutput');

  const dosageData = {
    '10': {
      caps: '1/2 tampa (aprox. 2.5 ml)',
      desc: 'Para meio balde (10L): adicione meia tampa de Certeza. Misture e aguarde 30 minutos em repouso obrigatório.'
    },
    '20': {
      caps: '1 tampa cheia (5 ml)',
      desc: 'Balde de 20L: adicione 1 tampa de Certeza. Misture e aguarde 30 minutos em repouso obrigatório antes de consumir.'
    },
    '40': {
      caps: '2 tampas completas (10 ml)',
      desc: 'Para 40 Litros (2 baldes): adicione 2 tampas de Certeza. Misture e aguarde 30 minutos de repouso.'
    },
    '60': {
      caps: '3 tampas completas (15 ml)',
      desc: 'Tambor de 60 Litros: adicione 3 tampas de Certeza. Mantenha tapado e aguarde 30 minutos.'
    }
  };

  doseButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      playClick();
      doseButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const liters = btn.getAttribute('data-liters');
      const data = dosageData[liters];
      if (data && dosingOutput) {
        dosingOutput.innerHTML = `
          <strong>Dosagem:</strong> ${data.caps}<br>
          <span style="font-weight: 400; font-size: 0.74rem; color: #475569;">${data.desc}</span>
        `;
      }
    });
  });

  // Temporizador de 20 segundos
  const washTimerBtn = document.getElementById('washTimerBtn');
  const washTimerDisplay = document.getElementById('washTimerDisplay');

  if (washTimerBtn) {
    washTimerBtn.addEventListener('click', () => {
      if (state.handWashTimer) {
        clearInterval(state.handWashTimer);
        state.handWashTimer = null;
        washTimerBtn.classList.remove('running');
        washTimerBtn.innerHTML = `<span>▶ Praticar 20 Segundos</span>`;
        if (washTimerDisplay) washTimerDisplay.textContent = '20s';
        return;
      }

      state.handWashTimeLeft = 20;
      washTimerBtn.classList.add('running');
      playTone(600, 'sine', 0.1, 0.15);

      state.handWashTimer = setInterval(() => {
        state.handWashTimeLeft -= 1;
        
        if (washTimerDisplay) {
          washTimerDisplay.textContent = `${state.handWashTimeLeft}s`;
        }
        
        washTimerBtn.innerHTML = `<span>Lavando... (${state.handWashTimeLeft}s)</span>`;

        if (state.handWashTimeLeft > 0) {
          playTone(450, 'sine', 0.05, 0.08);
        } else {
          clearInterval(state.handWashTimer);
          state.handWashTimer = null;
          washTimerBtn.classList.remove('running');
          washTimerBtn.innerHTML = `<span>✓ Mãos Limpas! Repetir</span>`;
          if (washTimerDisplay) washTimerDisplay.textContent = 'Feito!';
          playSuccessChime();
          showToast('Tempo concluído: 20 segundos praticados.');
        }
      }, 1000);
    });
  }

  // Quiz e avaliacao de resposta
  const quizOptionButtons = document.querySelectorAll('.quiz-option-btn');
  const feedbackSuccess = document.getElementById('feedbackSuccess');
  const feedbackError = document.getElementById('feedbackError');
  const errorExplanation = document.getElementById('errorExplanation');
  const quizOptionsContainer = document.getElementById('quizOptionsContainer');

  const errorMessages = {
    A: "Deixar a água repousar durante 5 minutos apenas decanta a terra e areia. A bactéria causadora da cólera continua ativa na água.",
    C: "Coar a água com pano retira apenas poeiras visíveis. Os microrganismos passam através do tecido e continuam perigosos."
  };

  async function registarRespostaQuiz(opcao, acertou) {
    try {
      if (state.supabaseClient) {
        await state.supabaseClient.from('estatisticas_quiz').insert([
          { opcao_escolhida: opcao, acertou: acertou }
        ]);
      } else {
        const stats = JSON.parse(localStorage.getItem('quiz_stats') || '[]');
        stats.push({ opcao, acertou, data: new Date().toISOString() });
        localStorage.setItem('quiz_stats', JSON.stringify(stats));
      }
    } catch (e) {
      // Ignorar silenciosamente
    }
  }

  quizOptionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const optionChosen = btn.getAttribute('data-option');
      const isCorrect = btn.getAttribute('data-correct') === 'true';

      quizOptionsContainer.style.display = 'none';

      registarRespostaQuiz(optionChosen, isCorrect);

      if (isCorrect) {
        playSuccessChime();
        feedbackError.style.display = 'none';
        feedbackSuccess.style.display = 'block';
        speakText("Resposta correta! A água de poço aberto deve ser fervida ou tratada com Certeza, aguardando trinta minutos.");
      } else {
        playErrorAlert();
        feedbackSuccess.style.display = 'none';
        feedbackError.style.display = 'block';
        if (errorExplanation) {
          errorExplanation.textContent = errorMessages[optionChosen] || "Esta prática não elimina as bactérias causadoras da cólera.";
        }
        speakText("Resposta incorreta. " + (errorMessages[optionChosen] || "A água precisa de ser fervida ou tratada com Certeza."));
      }
    });
  });

  const retryQuizBtn = document.getElementById('retryQuizBtn');
  if (retryQuizBtn) {
    retryQuizBtn.addEventListener('click', () => {
      playClick();
      feedbackError.style.display = 'none';
      feedbackSuccess.style.display = 'none';
      quizOptionsContainer.style.display = 'flex';
      stopNarration();
    });
  }

  const advanceQuizBtn = document.getElementById('advanceQuizBtn');
  if (advanceQuizBtn) {
    advanceQuizBtn.addEventListener('click', () => {
      playClick();
      goToScreen(5);
    });
  }

  // Mural Comunitário (Supabase + LocalStorage)
  const communityForm = document.getElementById('communityForm');
  const communityPostsList = document.getElementById('communityPostsList');

  const defaultPosts = [
    { nome: 'Prof. Zacarias', localizacao: 'Escola Sec. Hulene, Maputo', mensagem: 'Na nossa escola colocámos baldes com torneira e produto Certeza em todas as turmas.' },
    { nome: 'Comité de Saúde', 'localizacao': 'Bairro Munhava, Beira', mensagem: 'Após as chuvas, realizámos a cloração dos poços abertos e sensibilização porta a porta.' },
    { nome: 'Marta Penisselo', localizacao: 'Boane, Prov. Maputo', mensagem: 'Praticamos os 20 segundos de lavagem das mãos com sabão antes das refeições.' }
  ];

  async function carregarRelatos() {
    if (!communityPostsList) return;

    let posts = [];

    if (state.supabaseClient) {
      try {
        const { data, error } = await state.supabaseClient
          .from('relatos_comunitarios')
          .select('nome, localizacao, mensagem')
          .order('id', { ascending: false })
          .limit(8);

        if (!error && data && data.length > 0) {
          posts = data;
        }
      } catch (e) {
        // Fallback
      }
    }

    if (posts.length === 0) {
      const local = JSON.parse(localStorage.getItem('relatos_comunitarios') || '[]');
      posts = [...local, ...defaultPosts];
    }

    renderPosts(posts);
  }

  function renderPosts(posts) {
    if (!communityPostsList) return;
    communityPostsList.innerHTML = posts.map(p => `
      <div class="comm-post-item">
        <div class="comm-post-header">
          <span>${escapeHtml(p.nome)}</span>
          <span class="comm-post-loc">${escapeHtml(p.localizacao)}</span>
        </div>
        <div class="comm-post-msg">${escapeHtml(p.mensagem)}</div>
      </div>
    `).join('');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  if (communityForm) {
    communityForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nomeInput = document.getElementById('commName');
      const locInput = document.getElementById('commLocation');
      const msgInput = document.getElementById('commMessage');

      const novoRelato = {
        nome: nomeInput.value.trim(),
        localizacao: locInput.value.trim(),
        mensagem: msgInput.value.trim()
      };

      if (!novoRelato.nome || !novoRelato.localizacao || !novoRelato.mensagem) return;

      playClick();

      if (state.supabaseClient) {
        try {
          const { error } = await state.supabaseClient
            .from('relatos_comunitarios')
            .insert([novoRelato]);
          if (!error) {
            showToast('Compromisso registado com sucesso no Supabase!');
          } else {
            salvarLocal(novoRelato);
          }
        } catch (err) {
          salvarLocal(novoRelato);
        }
      } else {
        salvarLocal(novoRelato);
      }

      nomeInput.value = '';
      locInput.value = '';
      msgInput.value = '';

      carregarRelatos();
    });
  }

  function salvarLocal(relato) {
    const locais = JSON.parse(localStorage.getItem('relatos_comunitarios') || '[]');
    locais.unshift(relato);
    localStorage.setItem('relatos_comunitarios', JSON.stringify(locais));
    showToast('Compromisso partilhado com sucesso!');
  }

  // Notificacao rapida
  const toastNotice = document.getElementById('toastNotice');
  let toastTimer = null;

  function showToast(message) {
    if (!toastNotice) return;
    toastNotice.querySelector('.toast-text').textContent = message;
    toastNotice.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNotice.classList.remove('show');
    }, 4000);
  }

  // Iniciar no primeiro ecrã
  goToScreen(1);
});
