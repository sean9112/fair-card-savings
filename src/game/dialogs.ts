function dialog(content: string): HTMLDialogElement {
  const element = document.createElement('dialog');
  element.className = 'game-dialog';
  element.innerHTML = content;
  document.body.appendChild(element);
  return element;
}

export function askRecording(): Promise<boolean> {
  const element = dialog(`
    <h2>一起留下學習紀錄</h2>
    <p>你可以選擇記錄這局的任務、消費、存款與最後的反思，幫助回顧自己的策略。</p>
    <p>請不要輸入姓名、學號或其他個人資料。紀錄會傳送到這個遊戲的試算表，並可能暫存在此裝置；再次同意記錄時會重試七天內的紀錄。你也可以選擇不記錄。送出後需由老師查看試算表確認是否寫入。</p>
    <div class="dialog-actions"><button type="button" data-choice="no">不記錄，開始遊戲</button><button class="primary" type="button" data-choice="yes">同意記錄，開始遊戲</button></div>`);
  return new Promise((resolve) => {
    const finish = (value: boolean) => { element.close(); element.remove(); resolve(value); };
    element.querySelector('[data-choice="no"]')!.addEventListener('click', () => finish(false));
    element.querySelector('[data-choice="yes"]')!.addEventListener('click', () => finish(true));
    element.addEventListener('cancel', (event) => { event.preventDefault(); finish(false); });
    element.showModal();
  });
}

export function askReflection(recording: boolean): Promise<string | null> {
  const element = dialog(`
    <h2>回顧你的選擇</h2>
    <label for="reflection">哪一次選擇影響了你的存款？為什麼？下次會怎麼調整？</label>
    <textarea id="reflection" maxlength="500" rows="4" placeholder="寫下你的想法（最多 500 字）"></textarea>
    <p>${recording ? '請勿填入姓名、學號或其他個人資料。反思會和這局匿名紀錄一起送出。' : '你選擇了不記錄；這段文字只供你自己思考，不會送出。'}</p>
    <div class="dialog-actions"><button type="button" data-choice="skip">跳過</button><button class="primary" type="button" data-choice="done">完成</button></div>`);
  return new Promise((resolve) => {
    const finish = (value: string | null) => { element.close(); element.remove(); resolve(value); };
    element.querySelector('[data-choice="skip"]')!.addEventListener('click', () => finish(null));
    element.querySelector('[data-choice="done"]')!.addEventListener('click', () => finish(element.querySelector('textarea')!.value.trim() || null));
    element.addEventListener('cancel', (event) => { event.preventDefault(); finish(null); });
    element.showModal();
  });
}
