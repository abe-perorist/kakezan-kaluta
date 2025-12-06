// ゲーム状態管理
const GameState = {
    currentDan: null,
    currentMode: null, // 'dan', 'random', 'time-attack'
    currentQuestion: null,
    correctAnswer: null,
    score: 0,
    correctCount: 0,
    totalQuestions: 10,
    answeredQuestions: 0,
    timer: null,
    timeLeft: 30,
    startTime: null,
    questions: []
};

// ローカルストレージ管理
const Storage = {
    save: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('保存エラー:', e);
        }
    },
    
    load: function(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('読み込みエラー:', e);
            return defaultValue;
        }
    }
};

// データ初期化
const GameData = {
    collections: Storage.load('collections', {}),
    progress: Storage.load('progress', {}),
    bestTimes: Storage.load('bestTimes', {}),
    titles: Storage.load('titles', [])
};

// 九九星人のキャラクター設定
const Characters = {
    1: { emoji: '⭐', name: '1の段星人', color: '#FFD700' },
    2: { emoji: '🌟', name: '2の段星人', color: '#FF6B6B' },
    3: { emoji: '✨', name: '3の段星人', color: '#4ECDC4' },
    4: { emoji: '💫', name: '4の段星人', color: '#95E1D3' },
    5: { emoji: '🌠', name: '5の段星人', color: '#F38181' },
    6: { emoji: '🔮', name: '6の段星人', color: '#AA96DA' },
    7: { emoji: '💎', name: '7の段星人', color: '#FCBAD3' },
    8: { emoji: '🎆', name: '8の段星人', color: '#A8E6CF' },
    9: { emoji: '🌌', name: '9の段星人', color: '#FFD3A5' }
};

// 画面切り替え
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// 問題生成
function generateQuestion(dan = null) {
    let multiplier1, multiplier2;
    
    if (dan) {
        // 特定の段の練習
        multiplier1 = dan;
        multiplier2 = Math.floor(Math.random() * 9) + 1;
    } else {
        // ランダム出題
        multiplier1 = Math.floor(Math.random() * 9) + 1;
        multiplier2 = Math.floor(Math.random() * 9) + 1;
    }
    
    const answer = multiplier1 * multiplier2;
    const wrongAnswers = generateWrongAnswers(answer);
    
    return {
        question: `${multiplier1} × ${multiplier2} = ?`,
        answer: answer,
        options: shuffleArray([answer, ...wrongAnswers]),
        dan: multiplier1
    };
}

// 間違った選択肢を生成
function generateWrongAnswers(correctAnswer) {
    const wrongAnswers = new Set();
    while (wrongAnswers.size < 5) {
        const wrong = correctAnswer + Math.floor(Math.random() * 20) - 10;
        if (wrong > 0 && wrong !== correctAnswer && wrong <= 81) {
            wrongAnswers.add(wrong);
        }
    }
    return Array.from(wrongAnswers).slice(0, 5);
}

// 配列をシャッフル
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ゲーム開始
function startGame(dan = null, mode = 'dan') {
    GameState.currentDan = dan;
    GameState.currentMode = mode;
    GameState.score = 0;
    GameState.correctCount = 0;
    GameState.answeredQuestions = 0;
    GameState.timeLeft = mode === 'time-attack' ? 999 : 999; // タイマー制限をなくす
    GameState.startTime = Date.now();
    
    // 問題を事前に生成
    GameState.questions = [];
    
    if (dan && mode === 'dan') {
        // 段を選んで練習モードの場合、9問を被りなく出題（1×から9×まで）
        GameState.totalQuestions = 9;
        const multipliers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        shuffleArray(multipliers); // 順序をランダムに
        
        multipliers.forEach(multiplier2 => {
            const question = {
                question: `${dan} × ${multiplier2} = ?`,
                answer: dan * multiplier2,
                options: [],
                dan: dan
            };
            
            // 間違った選択肢を生成
            const wrongAnswers = generateWrongAnswers(question.answer);
            question.options = shuffleArray([question.answer, ...wrongAnswers]);
            
            GameState.questions.push(question);
        });
    } else {
        // ランダム出題モードやタイムアタックモードは従来通り
        GameState.totalQuestions = 10;
        for (let i = 0; i < GameState.totalQuestions; i++) {
            GameState.questions.push(generateQuestion(dan));
        }
    }
    
    showScreen('game-screen');
    updateGameUI();
    loadQuestion();
    
    // タイマー機能を無効化（30秒制限をなくす）
    // if (mode !== 'time-attack') {
    //     startTimer();
    // }
}

// タイマー開始
function startTimer() {
    if (GameState.timer) {
        clearInterval(GameState.timer);
    }
    
    GameState.timer = setInterval(() => {
        GameState.timeLeft--;
        updateTimer();
        
        if (GameState.timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

// タイマー更新
function updateTimer() {
    // タイマー制限をなくしたので「制限なし」と表示
    document.getElementById('timer').textContent = '制限なし';
}

// 問題を読み込む
function loadQuestion() {
    if (GameState.answeredQuestions >= GameState.totalQuestions) {
        endGame();
        return;
    }
    
    GameState.currentQuestion = GameState.questions[GameState.answeredQuestions];
    GameState.correctAnswer = GameState.currentQuestion.answer;
    
    // 問題表示
    document.getElementById('question').textContent = GameState.currentQuestion.question;
    
    // 段表示
    if (GameState.currentDan) {
        document.getElementById('current-dan').textContent = `${GameState.currentDan}の段`;
    } else {
        document.getElementById('current-dan').textContent = `${GameState.currentQuestion.dan}の段`;
    }
    
    // 選択肢表示
    const optionsContainer = document.getElementById('answer-options');
    optionsContainer.innerHTML = '';
    
    GameState.currentQuestion.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'answer-btn';
        button.textContent = option;
        button.onclick = () => selectAnswer(option);
        optionsContainer.appendChild(button);
    });
}

// 答えを選択
function selectAnswer(selectedAnswer) {
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach(btn => {
        btn.disabled = true;
        if (parseInt(btn.textContent) === GameState.correctAnswer) {
            btn.classList.add('correct');
        } else if (parseInt(btn.textContent) === selectedAnswer && selectedAnswer !== GameState.correctAnswer) {
            btn.classList.add('incorrect');
        }
    });
    
    if (selectedAnswer === GameState.correctAnswer) {
        handleCorrectAnswer();
    } else {
        handleIncorrectAnswer();
    }
    
    GameState.answeredQuestions++;
    
    // 正解アニメーションが終わったらすぐに次の問題へ
    if (selectedAnswer === GameState.correctAnswer) {
        // 正解時はアニメーション（0.5秒）が終わったら次の問題へ
        setTimeout(() => {
            if (GameState.answeredQuestions < GameState.totalQuestions) {
                loadQuestion();
            } else {
                endGame();
            }
        }, 500);
    } else {
        // 不正解時は少し待ってから次の問題へ
        setTimeout(() => {
            if (GameState.answeredQuestions < GameState.totalQuestions) {
                loadQuestion();
            } else {
                endGame();
            }
        }, 1500);
    }
}

// 正解時の処理
function handleCorrectAnswer() {
    GameState.correctCount++;
    GameState.score += 100;
    
    // スコア更新
    updateScore();
    
    // 正解アニメーション
    showCorrectAnimation();
    
    // ご褒美をランダムで付与
    if (Math.random() < 0.3) { // 30%の確率
        giveReward();
    }
}

// 不正解時の処理
function handleIncorrectAnswer() {
    // 不正解のフィードバックはCSSアニメーションで処理
}

// 正解アニメーション表示
function showCorrectAnimation() {
    const animation = document.getElementById('correct-animation');
    
    animation.classList.add('active');
    
    setTimeout(() => {
        animation.classList.remove('active');
    }, 500);
}

// ご褒美を付与
function giveReward() {
    const dan = GameState.currentQuestion.dan;
    const char = Characters[dan];
    
    // レア度をランダムに決定
    const rarity = Math.random();
    let rarityType = 'normal';
    if (rarity < 0.05) {
        rarityType = 'ultra-rare';
    } else if (rarity < 0.3) {
        rarityType = 'rare';
    }
    
    // コレクションに追加
    if (!GameData.collections[dan]) {
        GameData.collections[dan] = [];
    }
    
    GameData.collections[dan].push({
        emoji: char.emoji,
        name: char.name,
        rarity: rarityType,
        date: new Date().toISOString()
    });
    
    Storage.save('collections', GameData.collections);
}

// スコア更新
function updateScore() {
    document.getElementById('score').textContent = GameState.score;
    document.getElementById('correct-count').textContent = GameState.correctCount;
    
    const progress = (GameState.answeredQuestions / GameState.totalQuestions) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;
}

// ゲームUI更新
function updateGameUI() {
    document.getElementById('score').textContent = GameState.score;
    document.getElementById('correct-count').textContent = GameState.correctCount;
    document.getElementById('total-questions').textContent = GameState.totalQuestions;
    updateTimer();
}

// ゲーム終了
function endGame() {
    if (GameState.timer) {
        clearInterval(GameState.timer);
    }
    
    const accuracy = Math.round((GameState.correctCount / GameState.totalQuestions) * 100);
    const timeElapsed = GameState.currentMode === 'time-attack' ? Math.floor((Date.now() - GameState.startTime) / 1000) : null;
    
    // 結果画面に表示
    document.getElementById('result-correct').textContent = `${GameState.correctCount}/${GameState.totalQuestions}`;
    document.getElementById('result-accuracy').textContent = `${accuracy}%`;
    document.getElementById('result-score').textContent = GameState.score;
    
    // ご褒美表示
    const rewardContainer = document.getElementById('reward-container');
    rewardContainer.innerHTML = '';
    
    if (GameState.correctCount === GameState.totalQuestions) {
        const rewardTitle = document.createElement('div');
        rewardTitle.className = 'reward-title';
        rewardTitle.textContent = '🎉 完璧です！';
        rewardContainer.appendChild(rewardTitle);
    }
    
    // 達成度を更新
    updateProgress();
    
    // タイムアタックモードの場合、ベストタイムを更新
    if (GameState.currentMode === 'time-attack' && timeElapsed) {
        const key = GameState.currentDan ? `dan-${GameState.currentDan}` : 'random';
        const currentBest = GameData.bestTimes[key] || Infinity;
        if (timeElapsed < currentBest) {
            GameData.bestTimes[key] = timeElapsed;
            Storage.save('bestTimes', GameData.bestTimes);
            
            const newRecord = document.createElement('div');
            newRecord.className = 'reward-item';
            newRecord.textContent = `🏆 新記録！ ${timeElapsed}秒`;
            rewardContainer.appendChild(newRecord);
        }
    }
    
    showScreen('result-screen');
}

// 達成度を更新
function updateProgress() {
    if (GameState.currentDan) {
        const key = `dan-${GameState.currentDan}`;
        if (!GameData.progress[key]) {
            GameData.progress[key] = {
                played: 0,
                correct: 0,
                total: 0,
                bestScore: 0
            };
        }
        
        GameData.progress[key].played++;
        GameData.progress[key].correct += GameState.correctCount;
        GameData.progress[key].total += GameState.totalQuestions;
        GameData.progress[key].bestScore = Math.max(GameData.progress[key].bestScore, GameState.score);
        
        // マスター称号をチェック
        const accuracy = (GameData.progress[key].correct / GameData.progress[key].total) * 100;
        if (accuracy >= 90 && GameData.progress[key].played >= 3) {
            const title = `${GameState.currentDan}の段マスター`;
            if (!GameData.titles.includes(title)) {
                GameData.titles.push(title);
                Storage.save('titles', GameData.titles);
            }
        }
    }
    
    Storage.save('progress', GameData.progress);
}

// コレクション画面を表示
function showCollection() {
    const grid = document.getElementById('collection-grid');
    grid.innerHTML = '';
    
    for (let dan = 1; dan <= 9; dan++) {
        const card = document.createElement('div');
        const char = Characters[dan];
        const collection = GameData.collections[dan] || [];
        
        card.className = 'collection-card';
        if (collection.length === 0) {
            card.classList.add('locked');
        }
        
        card.innerHTML = `
            <div class="card-emoji">${char.emoji}</div>
            <div class="card-name">${char.name}</div>
            <div class="card-count">${collection.length > 0 ? `⭐ ${collection.length}枚` : '未獲得'}</div>
        `;
        
        grid.appendChild(card);
    }
    
    showScreen('collection-screen');
}

// データをリセット
function resetAllData() {
    if (confirm('すべての進捗データ、コレクション、記録をリセットしますか？\nこの操作は取り消せません。')) {
        // ローカルストレージをクリア
        localStorage.removeItem('collections');
        localStorage.removeItem('progress');
        localStorage.removeItem('bestTimes');
        localStorage.removeItem('titles');
        
        // メモリ上のデータもリセット
        GameData.collections = {};
        GameData.progress = {};
        GameData.bestTimes = {};
        GameData.titles = [];
        
        alert('すべてのデータをリセットしました。');
        
        // メニュー画面に戻る
        showScreen('main-menu');
    }
}

// 達成度画面を表示
function showProgress() {
    const list = document.getElementById('progress-list');
    list.innerHTML = '';
    
    for (let dan = 1; dan <= 9; dan++) {
        const progress = GameData.progress[`dan-${dan}`] || { played: 0, correct: 0, total: 0 };
        const accuracy = progress.total > 0 ? Math.round((progress.correct / progress.total) * 100) : 0;
        
        const item = document.createElement('div');
        item.className = 'progress-item';
        item.innerHTML = `
            <div class="progress-item-name">${dan}の段</div>
            <div class="progress-item-value">正答率: ${accuracy}% (${progress.played}回プレイ)</div>
        `;
        
        list.appendChild(item);
    }
    
    // 全段制覇進捗
    const masteredCount = Object.keys(GameData.progress).filter(key => {
        const p = GameData.progress[key];
        if (!p || p.total === 0) return false;
        return (p.correct / p.total) * 100 >= 80;
    }).length;
    
    const masteryItem = document.createElement('div');
    masteryItem.className = 'progress-item';
    masteryItem.innerHTML = `
        <div class="progress-item-name">全段制覇進捗</div>
        <div class="progress-item-value">${masteredCount}/9 段マスター</div>
    `;
    list.appendChild(masteryItem);
    
    showScreen('progress-screen');
}

// イベントリスナー設定
document.addEventListener('DOMContentLoaded', () => {
    // 段ボタン
    document.querySelectorAll('.dan-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const dan = parseInt(btn.dataset.dan);
            startGame(dan, 'dan');
        });
    });
    
    // ランダムモード
    document.getElementById('random-mode').addEventListener('click', () => {
        startGame(null, 'random');
    });
    
    // タイムアタックモード
    document.getElementById('time-attack-mode').addEventListener('click', () => {
        startGame(null, 'time-attack');
    });
    
    // コレクション
    document.getElementById('collection-btn').addEventListener('click', showCollection);
    
    // 達成度
    document.getElementById('progress-btn').addEventListener('click', showProgress);
    
    // リセットボタン
    document.getElementById('reset-btn').addEventListener('click', resetAllData);
    
    // 戻るボタン
    document.getElementById('back-to-menu').addEventListener('click', () => {
        if (GameState.timer) {
            clearInterval(GameState.timer);
        }
        showScreen('main-menu');
    });
    
    document.getElementById('back-from-collection').addEventListener('click', () => {
        showScreen('main-menu');
    });
    
    document.getElementById('back-from-progress').addEventListener('click', () => {
        showScreen('main-menu');
    });
    
    // 結果画面のボタン
    document.getElementById('play-again').addEventListener('click', () => {
        if (GameState.currentDan) {
            startGame(GameState.currentDan, GameState.currentMode);
        } else {
            startGame(null, GameState.currentMode);
        }
    });
    
    document.getElementById('back-to-menu-result').addEventListener('click', () => {
        showScreen('main-menu');
    });
});

