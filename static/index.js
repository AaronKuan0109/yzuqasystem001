function copyText(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Text copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    } else {
        alert('Clipboard API is not supported in your browser.');
    }
}

document.getElementById('startBtn').addEventListener('click', startRecording);
document.getElementById('stopBtn').addEventListener('click', stopRecording);

let mediaRecorder;
let audioChunks = [];
const userInput = document.querySelector(".user-input");
const chatHistory = document.querySelector(".chat-history");

function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            audioChunks = [];
            console.log("錄音開始");

            mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener('stop', () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                uploadAudio(audioBlob);
            });
        })
        .catch(error => console.error('無法開始錄音:', error));
}

function stopRecording() {
    if (mediaRecorder) {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        console.log("錄音結束");
    }
}

function uploadAudio(blob) {
    const formData = new FormData();
    formData.append('audio', blob, 'recording.wav');

    fetch('/upload-audio', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.transcript) {
            userInput.value = data.transcript; // 將語音轉文字結果填入輸入框
            appendMessageToChat('You', data.transcript); // 在對話框顯示語音內容
        } else {
            console.error('語音轉文字失敗:', data.message);
        }
    })
    .catch(error => console.error('上傳語音時出錯:', error));
}

function appendMessageToChat(sender, message) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender.toLowerCase());
    messageDiv.innerHTML = `<p><strong>${sender}:</strong> ${message}</p>`;
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight; // 滾動到最新消息
}

// 當網頁DOM內容被加載完成後，這個函數會被觸發
document.addEventListener("DOMContentLoaded", function() {
    const chatForm = document.getElementById("chat-form");
    const userInput = document.querySelector(".user-input");
    const chatHistory = document.querySelector(".chat-history");
    const exampleQuestionsContainer = document.querySelector(".example-questions");

    // 隱藏範例問題的容器
    exampleQuestionsContainer.style.display = "none";
    
   

    // 顯示範例問題的功能
    function displayExampleQuestions(questions) {
        exampleQuestionsContainer.innerHTML = ''; // 清空舊的範例問題
        if (questions && questions.length > 0) {
            questions.forEach(question => {
                const questionBubble = document.createElement("div");
                questionBubble.classList.add("example-question");
                questionBubble.textContent = question;
                questionBubble.addEventListener("click", function() {
                    userInput.value = question;  // 將範例問題填入輸入框
                    exampleQuestionsContainer.style.display = "none";  // 隱藏範例問題
                });
                exampleQuestionsContainer.appendChild(questionBubble);
            });
            exampleQuestionsContainer.style.display = "flex";
        } else {
            exampleQuestionsContainer.style.display = "none";
        }
    }

    // 定義表單提交功能
    function submitForm() {
        const userMessage = userInput.value.trim();
        if (userMessage === "") return;

        // 清除範例問題
        exampleQuestionsContainer.style.display = "none";
       

        const userMessageDiv = document.createElement("div");
        userMessageDiv.classList.add("message", "user");
        userMessageDiv.innerHTML = "<i class='fa-solid fa-user'></i><p>" + userMessage + "</p>";
        chatHistory.appendChild(userMessageDiv);

        const loader = document.createElement("div");
        loader.classList.add("loader", "message", "assistant");
        chatHistory.appendChild(loader);

        fetch("/get_response", {
            method: "POST",
            body: new URLSearchParams({ user_input: userMessage }),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        })
        .then(response => response.json())
        .then(data => {
            chatHistory.removeChild(loader);
            const assistantMessageDiv = document.createElement("div");
            assistantMessageDiv.classList.add("message", "assistant");
            const escapedAssistantMessage = data.response.replace(/\n/g, "<br>");
            assistantMessageDiv.innerHTML = `<i class='fa-solid fa-comment'></i><p id='res-mes'>${escapedAssistantMessage}</p>`;
            chatHistory.appendChild(assistantMessageDiv);
            assistantMessageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });

            // 回答後重新生成新的範例問題
            //displayExampleQuestions(data.example_questions);
        });
        userInput.value = "";  // 清空輸入框
    }

    // 提交表單的監聽
    chatForm.addEventListener("submit", function(event) {
        event.preventDefault();
        const mainTitle = document.getElementById("main-title");
        if (mainTitle) {
         mainTitle.innerHTML = ''; // 清空中央標題文字內容
        }

    // 在右上角標題中顯示文字
        const rightTitle = document.getElementById("right-title");
        if (rightTitle) {
         rightTitle.innerHTML = 'Academic Affairs<br>QA System'; // 在右上角顯示文字
        }
        submitForm();
    });
});

