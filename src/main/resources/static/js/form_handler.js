// form_handler.js

// ★インスタンス管理のためのマップ
// キー: questionId (string)
// 値: { formEl, questionTypeEl, optionsList, matchingLeftList, ... }
const formDomMap = {};

// ★グローバルカウンター: 各フォームインスタンスの操作時に一時的に使用
let matchingLCount = 0; 
let matchingRCount = 0;
let optionCount = 0; 

/**
 * 特定のフォームインスタンスのDOM参照を設定する
 * (exam_manager.js の loadEditorContent から呼び出される)
 * @param {string} questionId - 問題ID
 * @param {HTMLElement} formEl - <form> 要素
 * @param {HTMLElement} dynamicContentArea - 動的エリアのコンテナ
 */
function setFormHandlerDOMs(questionId, formEl, dynamicContentArea) {
    // カウンターをリセット
    matchingLCount = 0;
    matchingRCount = 0;
    optionCount = 0; 

    // DOM参照をマップに格納
    formDomMap[questionId] = {
        formEl: formEl,
        questionTypeEl: formEl.querySelector('select[name="questionType"]'),
        dynamicContentArea: dynamicContentArea,
        
        // Dynamic elements (これらは showHideFields で再取得される)
        correctAnswerInput: null,
        optionsManagement: null,
        optionsList: null,
        matchingField: null,
        matchingInfoMessage: null,
        matchingLeftList: null,
        matchingRightList: null,
    };
}


// ----------------------------------------------------
// フォームの動的表示とHTMLテンプレート
// ----------------------------------------------------

/**
 * 問題形式に応じて動的エリアの表示を切り替える
 * @param {string} questionId - フォームのID
 */
function showHideFields(questionId) {
    const instance = formDomMap[questionId];
    if (!instance) return;

    const type = instance.questionTypeEl.value;
    const container = instance.dynamicContentArea;
    const initialAnswer = instance.formEl.querySelector('input[name="initialCorrectAnswer"]').value;

    // 1. まず全体を空にして、新しいHTMLを挿入
    container.innerHTML = getDynamicFormHTML(type, questionId);
    
    // 2. DOM要素を再取得してインスタンスに格納し直す
    instance.correctAnswerInput = container.querySelector('input[name="correctAnswer"], textarea[name="correctAnswer"]');
    instance.optionsManagement = container.querySelector('#optionsManagement');
    instance.optionsList = container.querySelector('#optionsList');
    instance.matchingField = container.querySelector('#matchingField');
    instance.matchingInfoMessage = container.querySelector('#matchingInfoMessage');
    instance.matchingLeftList = container.querySelector('#matchingLeftList');
    instance.matchingRightList = container.querySelector('#matchingRightList');

    // 3. 既存の正解データをフォームにセット
    if (instance.correctAnswerInput) {
        if (type === 'TRUE_FALSE') {
            // ○×の場合、ラジオボタンをチェック
            const radio = container.querySelector(`input[name="correctAnswer"][value="${initialAnswer}"]`);
            if (radio) radio.checked = true;
        } else {
            // 記述式/並べ替え/マッチングの場合、テキストフィールドにセット
            instance.correctAnswerInput.value = initialAnswer;
        }
    }
}

/**
 * 問題形式に応じた詳細フォームのHTMLを返す
 */
function getDynamicFormHTML(type, questionId) {
    let html = '';

    // 記述式, 並べ替え
    if (type === 'TEXT' || type === 'ORDERING') {
        html = `
            <div id="correctAnswerField">
                <label for="correctAnswer-${questionId}" class="block text-sm font-medium text-gray-700">正解 (記述式・並べ替えのシーケンス)</label>
                <input type="text" name="correctAnswer" id="correctAnswer-${questionId}" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
            </div>
        `;
    } 
    // ○×問題
    else if (type === 'TRUE_FALSE') {
         html = `
            <div id="trueFalseField">
                <label class="block text-sm font-medium text-gray-700">正解を選択</label>
                <div class="mt-2 flex space-x-6">
                    <label class="inline-flex items-center">
                        <input type="radio" name="correctAnswer" value="TRUE" class="text-indigo-600 focus:ring-indigo-500">
                        <span class="ml-2">○ (TRUE)</span>
                    </label>
                    <label class="inline-flex items-center">
                        <input type="radio" name="correctAnswer" value="FALSE" class="text-indigo-600 focus:ring-indigo-500">
                        <span class="ml-2">× (FALSE)</span>
                    </label>
                </div>
                <input type="hidden" name="correctAnswer" value="">
            </div>
        `;
    }
    // マッチング問題
    else if (type === 'MATCHING') {
        html = `
            <div id="correctAnswerField">
                <label for="correctAnswer-${questionId}" class="block text-sm font-medium text-gray-700">正解 (ペアリング情報 例: L1-R3,L2-R1,...)</label>
                <input type="text" name="correctAnswer" id="correctAnswer-${questionId}" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
            </div>
            
            <div id="matchingField">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <h4 class="text-base font-semibold mb-2 text-gray-700">左側の要素 (問題)</h4>
                        <div id="matchingLeftList" class="space-y-2 p-2 border rounded bg-gray-50"></div>
                        <button type="button" onclick="addMatchingElement('${questionId}', 'left')" class="mt-2 text-sm text-indigo-600 hover:text-indigo-800">＋要素を追加</button>
                    </div>
                    <div>
                        <h4 class="text-base font-semibold mb-2 text-gray-700">右側の要素 (正解ペア)</h4>
                        <div id="matchingRightList" class="space-y-2 p-2 border rounded bg-gray-50"></div>
                        <button type="button" onclick="addMatchingElement('${questionId}', 'right')" class="mt-2 text-sm text-indigo-600 hover:text-indigo-800">＋要素を追加</button>
                    </div>
                </div>
                <div class="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md" id="matchingInfoMessage">
                    <p class="text-sm font-medium text-yellow-800">
                        🚨 **正解のペアリング情報 (必須):**
                        <br>
                        左の要素番号と右の要素番号を `-` でつなぎ、全体を `,` で区切って、**上記の「正解」入力欄に手動で入力**してください。
                        <br>
                        <span class="font-mono text-xs">例: L1-R3,L2-R1,L3-R2</span>
                    </p>
                </div>
            </div>
        `;
    }
    // 選択式問題 (MULTIPLE_CHOICE)
    else if (type === 'MULTIPLE_CHOICE') {
        html = `
            <div id="optionsManagement">
                <h4 class="text-base font-semibold mb-2 text-gray-700">選択肢のリスト</h4>
                <div id="optionsList" class="space-y-3 p-3 border rounded bg-gray-50"></div>
                <button type="button" onclick="addOption('${questionId}')" class="mt-3 text-sm font-medium bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300 transition">＋選択肢を追加</button>
                <div class="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-md">
                    <p class="text-sm font-medium text-blue-800">
                        💡 **正解の指定:** 複数の選択肢にチェックを入れることで、**複数選択形式**として設定できます。
                    </p>
                </div>
                </div>
        `;
    }
    return html;
}

// ----------------------------------------------------
// マッチング問題ロジック
// ----------------------------------------------------

/**
 * マッチング要素を追加する
 */
function addMatchingElement(questionId, side, initialText = '') {
    const instance = formDomMap[questionId];
    if (!instance || !instance.matchingLeftList || !instance.matchingRightList) return;

    let count, counterName, container, prefix;

    if (side === 'left') {
        matchingLCount++;
        count = matchingLCount;
        counterName = 'left';
        container = instance.matchingLeftList;
        prefix = 'L';
    } else {
        matchingRCount++;
        count = matchingRCount;
        counterName = 'right';
        container = instance.matchingRightList;
        prefix = 'R';
    }

    const elementId = `matching-${prefix}${count}-${questionId}`;
    
    const div = document.createElement('div');
    div.className = 'flex items-center space-x-2 bg-white p-2 rounded shadow-sm border';
    div.id = elementId;

    div.innerHTML = `
        <span class="font-mono text-sm font-semibold text-gray-600">${prefix}${count}:</span>
        <input type="text" 
               name="matchingElement[${prefix}${count}]" 
               value="${initialText}"
               placeholder="${prefix}${count}の要素を入力" 
               required 
               class="flex-grow border border-gray-300 rounded-md shadow-sm p-1 text-sm">
               
        <button type="button" 
                onclick="removeMatchingElement('${questionId}', '${elementId}')" 
                class="text-red-500 hover:text-red-700 text-xl font-bold leading-none">×</button>
    `;

    container.appendChild(div);
}

/**
 * マッチング要素を削除する
 */
function removeMatchingElement(questionId, id) {
    const el = document.getElementById(id);
    if (el) {
        el.remove();
        // マッチングはインデックスの再振り直しが不要
    }
}


// ----------------------------------------------------
// 選択式問題ロジック
// ----------------------------------------------------

/**
 * 選択肢を追加する
 */
function addOption(questionId, initialText = '', isCorrect = false) {
    const instance = formDomMap[questionId];
    if (!instance || !instance.optionsList) return;

    optionCount++;
    const currentOptionIndex = optionCount - 1; // 0, 1, 2, ...
    const optionId = `option-${currentOptionIndex}-${questionId}`;
    
    const div = document.createElement('div');
    div.className = 'flex items-center space-x-3 bg-white p-2 rounded shadow-sm border';
    div.id = optionId;

    div.innerHTML = `
        <input type="checkbox" 
               name="correctOptionIndexes" 
               value="${currentOptionIndex}" 
               ${isCorrect ? 'checked' : ''}
               class="form-checkbox h-5 w-5 text-indigo-600 rounded">
               
        <input type="text" 
               name="options[${currentOptionIndex}].optionText" 
               value="${initialText}"
               placeholder="選択肢のテキストを入力" 
               required 
               class="flex-grow border border-gray-300 rounded-md shadow-sm p-1 text-sm">
               
        <button type="button" 
                onclick="removeOption('${questionId}', '${optionId}')" 
                class="text-red-500 hover:text-red-700 text-xl font-bold leading-none">×</button>
                
        <input type="hidden" 
               name="options[${currentOptionIndex}].index" 
               value="${currentOptionIndex}">
    `;

    instance.optionsList.appendChild(div);
    
    // インデックスの再振り直しは、削除時のみ行う
}

/**
 * 選択肢を削除する
 */
function removeOption(questionId, id) {
    const el = document.getElementById(id);
    if (el) {
        el.remove();
        reindexOptions(questionId); // 削除後、インデックスを振り直す
    }
}

/**
 * 選択肢のインデックスを再振り直し
 */
function reindexOptions(questionId) {
    const instance = formDomMap[questionId];
    if (!instance || !instance.optionsList) return;

    const list = instance.optionsList;
    const optionElements = list.querySelectorAll('.flex.items-center.space-x-3.bg-white');
    
    optionCount = 0;
    
    optionElements.forEach((div, index) => {
        const newIndex = index;
        
        // 1. 各要素内の name 属性と value を新しいインデックスに更新
        
        const checkbox = div.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.value = newIndex; 
        }

        const textInput = div.querySelector('input[name$=".optionText"]');
        if (textInput) {
            textInput.name = `options[${newIndex}].optionText`;
        }
        
        const hiddenInput = div.querySelector('input[name$=".index"]');
        if (hiddenInput) {
            hiddenInput.name = `options[${newIndex}].index`;
            hiddenInput.value = newIndex;
        }

        // IDも更新
        div.id = `option-${newIndex}-${questionId}`;

        // 2. グローバルカウンターを更新
        optionCount = newIndex + 1;
    });
}


// ----------------------------------------------------
// データロードロジック (exam_manager.jsから呼び出される)
// ----------------------------------------------------

/**
 * 既存のオプションデータをインラインフォームにロードする
 */
function loadExistingOptionsToInlineForm(questionId, options, questionType) {
    if (!options || options.length === 0) {
        initializeDefaultOptions(questionId, questionType);
        return;
    }

    if (questionType === 'MULTIPLE_CHOICE') {
        options.forEach(opt => {
            // addOption はグローバルカウンター (optionCount) を使用してインデックスを振る
            addOption(questionId, opt.optionText, opt.isCorrect); 
        });
    } else if (questionType === 'MATCHING') {
        // マッチングの場合、L要素とR要素に分けてフォームに追加
        
        const leftOptions = options.filter(opt => opt.optionText.startsWith('L'));
        const rightOptions = options.filter(opt => opt.optionText.startsWith('R'));

        // L要素の復元
        leftOptions.forEach(opt => {
            const text = opt.optionText.substring(opt.optionText.indexOf(':') + 1);
            addMatchingElement(questionId, 'left', text); 
        });
        
        // R要素の復元
        rightOptions.forEach(opt => {
            const text = opt.optionText.substring(opt.optionText.indexOf(':') + 1);
            addMatchingElement(questionId, 'right', text); 
        });
    }
}

/**
 * 選択肢がない場合にデフォルトの要素を追加する
 */
function initializeDefaultOptions(questionId, questionType) {
    if (questionType === 'MULTIPLE_CHOICE') {
        addOption(questionId, '選択肢 1', false);
        addOption(questionId, '選択肢 2', false);
    } else if (questionType === 'MATCHING') {
        addMatchingElement(questionId, 'left', '要素1');
        addMatchingElement(questionId, 'right', '要素A');
    }
}