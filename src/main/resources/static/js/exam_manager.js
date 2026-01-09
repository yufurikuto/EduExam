// exam_manager.js

// ----------------------------------------------------
// API連携/順序更新
// ----------------------------------------------------

/**
 * 問題リストの連番を振り直す
 */
function updateQuestionNumbers() {
    const items = document.querySelectorAll('#questionListContainer .problem-number');
    items.forEach((item, index) => {
        item.textContent = `${index + 1}. `;
    });
}

/**
 * 問題の順序をサーバーに保存する
 */
function saveQuestionOrder() {
    const order = [];
    document.querySelectorAll('#questionListContainer .problem-item').forEach(item => {
        order.push(item.id.replace('question-', ''));
    });
    
    const examId = document.querySelector('input[name="examId"]').value;

    fetch('/exam/create/updateOrder', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded', 
        },
        body: `examId=${examId}&${order.map(id => 'orderedQuestionIds=' + id).join('&')}`
    })
    .then(response => {
        if (response.ok) {
            console.log("順序保存成功:", order);
        } else {
            console.error("順序保存失敗 (HTTP " + response.status + ")");
        }
    })
    .catch(error => console.error('順序保存中にネットワークエラー:', error));
}


/**
 * 問題削除の確認ダイアログとPOST処理
 */
function confirmDelete(questionIdStr, examIdStr) {
    if (confirm('本当にこの問題を削除しますか？')) {
        const form = document.createElement('form');
        form.method = 'POST';
        
        const questionId = questionIdStr.replace(/'/g, ''); 
        const examId = examIdStr && examIdStr.toUpperCase() !== 'NULL' ? examIdStr.replace(/'/g, '') : null;

        form.action = `/exam/create/deleteQuestion/${questionId}`;
        
        const examIdInput = document.createElement('input');
        examIdInput.type = 'hidden';
        examIdInput.name = 'examId';
        examIdInput.value = examId; 
        form.appendChild(examIdInput);

        document.body.appendChild(form);
        form.submit();
    }
}

/**
 * 問題を複製する
 */
function duplicateQuestion(questionIdStr, examIdStr) {
    if (!confirm('この問題を複製しますか？')) {
        return;
    }

    const questionId = questionIdStr.replace(/'/g, ''); 
    
    fetch(`/exam/create/duplicateQuestion/${questionId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(`問題複製エラー: ${data.error}`);
            console.error(data.error);
        } else {
            // 成功したらリロード
            let reloadUrl = window.location.href;
            if (reloadUrl.includes('?')) {
                reloadUrl += `&message=問題が複製されました。`;
            } else {
                reloadUrl += `?message=問題が複製されました。`;
            }
            window.location.href = reloadUrl;
        }
    })
    .catch(error => {
        alert("複製処理中にエラーが発生しました。");
        console.error('複製APIエラー:', error);
    });
}


// ----------------------------------------------------
// インライン編集の切り替えロジック
// ----------------------------------------------------

let activeEditorId = null; // 現在編集中の問題IDを追跡

/**
 * 指定された問題のインライン編集エリアを展開・格納する
 */
function toggleInlineEditor(questionId, examId) {
    const targetItem = document.getElementById(`question-${questionId}`);
    const targetEditorArea = document.getElementById(`editor-${questionId}`);
    const editButton = targetItem.querySelector('.edit-toggle-button');
    
    if (!targetItem || !targetEditorArea) return;

    // 1. 既に開いているエディタを閉じる
    if (activeEditorId && activeEditorId !== questionId) {
        const prevItem = document.getElementById(`question-${activeEditorId}`);
        const prevEditor = document.getElementById(`editor-${activeEditorId}`);
        const prevButton = prevItem.querySelector('.edit-toggle-button');

        if (prevEditor && prevEditor.style.display !== 'none') {
             prevEditor.style.display = 'none';
             prevButton.textContent = '編集';
             prevItem.classList.remove('border-indigo-600', 'shadow-xl');
             prevItem.classList.add('border-gray-300', 'shadow-sm');
        }
    }

    // 2. ターゲットエディタの表示を切り替える
    if (targetEditorArea.style.display === 'none') {
        // 開く処理
        targetEditorArea.style.display = 'block';
        editButton.textContent = '閉じる';
        targetItem.classList.remove('border-gray-300', 'shadow-sm');
        targetItem.classList.add('border-indigo-600', 'shadow-xl');
        activeEditorId = questionId;

        // 編集フォームを動的にロードする
        loadEditorContent(questionId, examId, targetEditorArea); 
        
    } else {
        // 閉じる処理
        targetEditorArea.style.display = 'none';
        editButton.textContent = '編集';
        targetItem.classList.remove('border-indigo-600', 'shadow-xl');
        targetItem.classList.add('border-gray-300', 'shadow-sm');
        activeEditorId = null;
    }
}


/**
 * 編集エリアに問題情報を取得し、フォームを挿入する
 */
function loadEditorContent(questionId, examId, targetEditorArea) {
    targetEditorArea.innerHTML = `
        <div class="text-center p-4 text-gray-500">
            問題データをロード中... <span class="animate-spin inline-block">↻</span>
        </div>
    `;

    fetch(`/exam/create/getQuestionDetail/${questionId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('問題データの取得に失敗しました。');
            }
            return response.json();
        })
        .then(data => {
            const question = data.question;
            const options = data.options;
            
            // 1. 編集フォームのHTMLを生成
            targetEditorArea.innerHTML = generateInlineFormHTML(question, examId, questionId);
            
            // 2. フォームが挿入された後、DOM参照を取得
            const formId = `inlineEditForm-${questionId}`;
            const formEl = document.getElementById(formId);
            const dynamicContentArea = document.getElementById(`dynamicContentArea-${questionId}`);
            
            // 3. フォームハンドラに必要なDOM参照を設定
            setFormHandlerDOMs(questionId, formEl, dynamicContentArea);

            // 4. 問題形式に応じて詳細コンテンツをロードし、フォームを初期化
            const questionTypeSelect = formEl.querySelector('select[name="questionType"]');
            
            showHideFields(questionId); 
            
            // 5. 選択肢/マッチング要素のデータをフォームに復元
            if (options && options.length > 0) {
                loadExistingOptionsToInlineForm(questionId, options, question.questionType);
            } else {
                 initializeDefaultOptions(questionId, question.questionType);
            }
            
            questionTypeSelect.addEventListener('change', () => showHideFields(questionId));
        })
        .catch(error => {
            targetEditorArea.innerHTML = `<div class="p-4 text-red-700 bg-red-100 rounded">エラー: ${error.message}</div>`;
            console.error('問題ロードエラー:', error);
        });
}


/**
 * 静的なフォームHTMLを生成するヘルパー関数
 */
function generateInlineFormHTML(question, examId, questionId) {
    const formId = `inlineEditForm-${question.id}`;
    const correctAnswerValue = question.correctAnswer ? question.correctAnswer : '';
    
    // onsubmitで handleInlineSave を呼び出す
    return `
        <form action="/exam/create/addQuestion" method="post" id="${formId}" class="space-y-4" onsubmit="return handleInlineSave(event, '${questionId}')">
            <input type="hidden" name="id" value="${question.id}">
            <input type="hidden" name="examId" value="${examId}">
            
            <label class="block text-sm font-medium text-gray-700">問題文:</label>
            <textarea name="questionText" rows="3" class="w-full p-2 border rounded" placeholder="問題文" required>${question.questionText}</textarea>
            
            <div class="flex space-x-4">
                <div class="flex-grow">
                    <label class="block text-sm font-medium text-gray-700">形式:</label>
                    <select name="questionType" id="inlineQuestionType-${question.id}" class="w-full p-2 border rounded" required>
                        <option value="MULTIPLE_CHOICE" ${question.questionType === 'MULTIPLE_CHOICE' ? 'selected' : ''}>MULTIPLE_CHOICE</option>
                        <option value="TEXT" ${question.questionType === 'TEXT' ? 'selected' : ''}>TEXT</option>
                        <option value="TRUE_FALSE" ${question.questionType === 'TRUE_FALSE' ? 'selected' : ''}>TRUE_FALSE</option>
                        <option value="MATCHING" ${question.questionType === 'MATCHING' ? 'selected' : ''}>MATCHING</option>
                        <option value="ORDERING" ${question.questionType === 'ORDERING' ? 'selected' : ''}>ORDERING</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">配点:</label>
                    <input type="number" name="score" min="1" max="100" class="w-20 p-2 border rounded" value="${question.score}" required>
                </div>
            </div>
            
            <div id="dynamicContentArea-${question.id}">
                </div>
            
            <input type="hidden" name="initialCorrectAnswer" value="${correctAnswerValue}">

            <div class="flex justify-end space-x-2 pt-2 border-t items-center">
                <span id="saveStatus-${questionId}" class="text-sm text-green-600 font-medium mr-2" style="opacity: 0; transition: opacity 0.5s;"></span>
                
                <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">更新</button>
            </div>
        </form>
    `;
}

/**
 * インラインフォームの非同期保存を処理する (AJAX)
 */
function handleInlineSave(event, questionId) {
    event.preventDefault(); // リロードを阻止

    const form = document.getElementById(`inlineEditForm-${questionId}`);
    const statusEl = document.getElementById(`saveStatus-${questionId}`);
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // FormDataを URLSearchParams に変換して送信
    const formData = new FormData(form);
    const searchParams = new URLSearchParams(formData);

    // ボタンをローディング状態にする
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = '保存中...';
    submitBtn.disabled = true;

    fetch('/exam/create/updateQuestionAjax', {
        method: 'POST',
        body: searchParams
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            // 1. 成功メッセージ
            statusEl.textContent = '保存しました';
            statusEl.style.opacity = '1';
            setTimeout(() => { statusEl.style.opacity = '0'; }, 2000);

            // 2. リスト表示更新
            updateListHeaderUI(questionId, data.question);
        }
    })
    .catch(error => {
        console.error('保存エラー:', error);
        alert('保存中にエラーが発生しました。');
    })
    .finally(() => {
        // ボタン復帰
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    });

    return false;
}

/**
 * 保存後にリストのヘッダー表示を更新する
 */
function updateListHeaderUI(questionId, questionData) {
    const item = document.getElementById(`question-${questionId}`);
    if (!item) return;

    // 問題文
    const textEl = item.querySelector('.question-text-display');
    if (textEl) textEl.textContent = questionData.questionText;

    // 形式
    const typeEl = item.querySelector('.question-type-display');
    if (typeEl) typeEl.textContent = questionData.questionType;

    // 点数
    const scoreEl = item.querySelector('.question-score-display');
    if (scoreEl) scoreEl.textContent = `${questionData.score}点`;
    
    // ハイライト
    const header = item.querySelector('.header-area');
    if (header) {
        header.classList.add('bg-green-50');
        setTimeout(() => header.classList.remove('bg-green-50'), 500);
    }
}


// ----------------------------------------------------
// インポートモーダル機能
// ----------------------------------------------------

function openImportModal() {
    document.getElementById('importModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // 背景スクロール固定
}

function closeImportModal() {
    document.getElementById('importModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// モーダル外クリックで閉じる
window.onclick = function(event) {
    const modal = document.getElementById('importModal');
    if (event.target === modal) {
        closeImportModal();
    }
}

/**
 * インポート候補のフィルタリング
 */
function filterImportQuestions() {
    const searchText = document.getElementById('importSearch').value.toLowerCase();
    const filterType = document.getElementById('importTypeFilter').value;
    const rows = document.querySelectorAll('.import-row');

    rows.forEach(row => {
        const text = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        const typeBadge = row.querySelector('td:nth-child(3) span');
        const type = typeBadge ? typeBadge.getAttribute('data-type') : ''; 

        const matchesSearch = text.includes(searchText);
        const matchesType = filterType === '' || type === filterType;

        if (matchesSearch && matchesType) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

/**
 * 全選択/全解除
 */
function toggleAllImport(source) {
    const checkboxes = document.querySelectorAll('input[name="questionIdsToImport"]');
    checkboxes.forEach(cb => {
        if (cb.closest('tr').style.display !== 'none') {
            cb.checked = source.checked;
        }
    });
}


// ----------------------------------------------------
// 初期化処理 (メインエントリ)
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. SortableJSの初期化
    const container = document.getElementById('questionListContainer');
    if (container && typeof Sortable !== 'undefined') {
        new Sortable(container, {
            animation: 150,
            handle: '.cursor-grab', 
            onEnd: function (evt) {
                updateQuestionNumbers();
                saveQuestionOrder(); 
            },
        });
    }
    
    // 2. 問題番号の初期設定
    updateQuestionNumbers();
    
    // 3. 新規問題追加ボタンのイベントリスナー
    const addButton = document.getElementById('addNewQuestionButton');
    if (addButton) {
        addButton.addEventListener('click', () => {
            const examIdInput = document.querySelector('input[name="examId"]');
            const examId = examIdInput ? examIdInput.value : null;

            if (!examId) {
                alert("試験IDが見つかりません。先に試験を保存してください。");
                return;
            }

            addButton.disabled = true;
            addButton.textContent = '作成中...';

            fetch('/exam/create/createEmptyQuestion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `examId=${examId}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    addButton.disabled = false;
                    addButton.textContent = '＋ 新しい問題を追加';
                } else {
                    window.location.reload();
                }
            })
            .catch(error => {
                console.error('新規作成エラー:', error);
                alert('問題の作成に失敗しました。');
                addButton.disabled = false;
                addButton.textContent = '＋ 新しい問題を追加';
            });
        });
    }
});