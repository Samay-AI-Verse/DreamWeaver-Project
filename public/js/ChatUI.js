document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const sidebar = document.getElementById('sidebar');
    const userAccount = document.getElementById('user-account');
    const userDropdown = document.getElementById('user-dropdown');
    const chatArea = document.getElementById('chat-area');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const welcomeScreen = document.getElementById('welcome-screen');
    const modelOptions = document.querySelectorAll('.model-option');
    const addBtn = document.getElementById('add-btn');
    const chatHistoryList = document.getElementById('chat-history-list');
    const exampleCards = document.querySelectorAll('.example-card');
    const expandedMenu = document.getElementById('expanded-menu');
    const pageContent = document.getElementById('page-content');
    const chatInterface = document.getElementById('chat-interface');
    const navLinks = document.querySelectorAll('.nav-link');
    const togglePinBtn = document.getElementById('toggle-pin');
    const fileUploadButton = document.getElementById('file-upload-button');
    const voiceAssistantButton = document.getElementById('voice-assistant-button');
    const micButton = document.getElementById('mic-button');
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const mobileNewChatBtn = document.getElementById('mobile-new-chat-btn');
    const mobileChatHistoryList = document.getElementById('mobile-chat-history-list');
    const mobileSidebarOverlay = document.getElementById('mobile-sidebar-overlay');

    const welcomePage = document.getElementById('welcome-page');
    const welcomeMessage = document.querySelector('.welcome-message');


    const personalizeModal = document.getElementById('personalize-modal');
    const closeModalButton = document.getElementById('close-modal');
    const savePreferencesButton = document.getElementById('save-preferences');
    const cancelPreferencesButton = document.getElementById('cancel-preferences');
    const userNameInput = document.getElementById('user-name');
    const genderButtons = document.querySelectorAll('#gender-buttons .select-button');
    const assistantButtons = document.querySelectorAll('#assistant-buttons .select-button');
    const languageButtons = document.querySelectorAll('#language-buttons .select-button');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');


    document.querySelectorAll('.user-dropdown-item').forEach(item => {
        if (item.textContent.includes('Personalize')) {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                personalizeModal.classList.add('active');
                userDropdownMobile.classList.remove('active');
                userDropdownDesktop.classList.remove('active');
                successMessage.style.display = 'none';
                errorMessage.style.display = 'none';
            });
        }
    });

    function showWelcomePage() {
        // Split the welcome message into individual letters
        const text = welcomeMessage.textContent;
        welcomeMessage.textContent = '';
        const directions = [
            { x: 0, y: -50 }, // Top
            { x: 0, y: 50 }, // Bottom
            { x: -50, y: 0 }, // Left
            { x: 50, y: 0 } // Right
        ];

        text.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char; // Preserve spaces
            // Randomly select a direction
            const direction = directions[Math.floor(Math.random() * directions.length)];
            // Set initial position using inline style
            span.style.transform = `translate(${direction.x}px, ${direction.y}px)`;
            span.style.animationDelay = `${index * 0.08}s`; // Increased stagger for effect
            welcomeMessage.appendChild(span);
        });

        // Hide chat interface initially
        chatInterface.style.display = 'none';

        // After animation, slide out welcome page and show chat interface
        setTimeout(() => {
            welcomePage.style.animation = 'slideOut 1s ease-in forwards';
            setTimeout(() => {
                welcomePage.style.display = 'none';
                chatInterface.style.display = 'flex';
                // Proceed with fetching chats
                fetchChats();
            }, 1000); // Match slideOut duration
        }, 3000); // Adjusted to allow time for letter animation and subtext
    }

    showWelcomePage();

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    function displaySelectedImage(file) {
        const previewContainer = document.createElement('div');
        previewContainer.className = 'image-preview-container';

        const imgPreview = document.createElement('img');
        imgPreview.className = 'image-preview';
        imgPreview.file = file;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-image-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = 'Remove image';
        removeBtn.addEventListener('click', () => {
            previewContainer.remove();
        });

        previewContainer.appendChild(imgPreview);
        previewContainer.appendChild(removeBtn);

        // Display above the input area
        const inputArea = document.querySelector('.input-area');
        inputArea.insertBefore(previewContainer, inputArea.firstChild);

        // Create a preview of the image
        const reader = new FileReader();
        reader.onload = (e) => { imgPreview.src = e.target.result; };
        reader.readAsDataURL(file);
    }

    // Modify the file upload button event listener
    fileUploadButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];

            // Check if file is an image
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file (JPEG, PNG, etc.)');
                return;
            }

            // Display the selected image
            displaySelectedImage(file);
        }
    });

    let currentSpeech = null;
    let preferredVoice = null;

    // Load voices and select a female one
    function setPreferredVoice() {
        const voices = window.speechSynthesis.getVoices();

        // Prefer Hindi or Marathi voices
        preferredVoice = voices.find(voice =>
            voice.lang.toLowerCase().includes("hi") ||  // Hindi
            voice.lang.toLowerCase().includes("mr") ||  // Marathi
            voice.name.toLowerCase().includes("hindi") ||
            voice.name.toLowerCase().includes("marathi") ||
            voice.name.toLowerCase().includes("भारत")
        );

        // If not found, fallback to female English voice
        if (!preferredVoice) {
            preferredVoice = voices.find(voice =>
                voice.name.toLowerCase().includes("female") ||
                voice.name.toLowerCase().includes("woman") ||
                voice.name.toLowerCase().includes("zira") ||
                voice.name.toLowerCase().includes("samantha")
            );
        }

        // Fallback: any non-male voice
        if (!preferredVoice) {
            preferredVoice = voices.find(v => !v.name.toLowerCase().includes("male"));
        }

        console.log("Selected voice:", preferredVoice?.name || "None");
    }




    let speechStates = new Map();

    function removeEmojis(text) {
        return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    }

    function toggleSpeech(messageContainer, content) {
        if (!content || typeof content !== 'string') return;

        const messageId = messageContainer.dataset.messageId || Date.now().toString();
        messageContainer.dataset.messageId = messageId;

        const state = speechStates.get(messageId) || { isPlaying: false, currentIndex: 0, utterances: [] };
        const button = messageContainer.querySelector('.speaker-button');

        if (state.isPlaying) {
            speechSynthesis.cancel();
            state.isPlaying = false;
            state.currentIndex = 0;
            state.utterances = [];
            button.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 3v18l15-9z" />
            </svg>
        `;
            return;
        }

        const cleanContent = removeEmojis(content);
        const chunks = cleanContent.match(/.{1,200}(?:\s|$)/g);
        if (!chunks) return;

        state.utterances = chunks.map(chunk => {
            const utterance = new SpeechSynthesisUtterance(chunk);
            if (preferredVoice) {
                utterance.voice = preferredVoice;
                utterance.lang = preferredVoice.lang;
            } else {
                utterance.lang = 'hi-IN';
            }
            return utterance;
        });

        state.currentIndex = 0;
        state.isPlaying = true;
        speechStates.set(messageId, state);
        button.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 4v16M14 4v16" />
        </svg>
    `;

        function speakNextChunk() {
            if (!state.isPlaying || state.currentIndex >= state.utterances.length) {
                state.isPlaying = false;
                button.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 3v18l15-9z" />
                </svg>
            `;
                return;
            }

            const utterance = state.utterances[state.currentIndex];
            utterance.onend = () => {
                state.currentIndex++;
                setTimeout(speakNextChunk, 100);
            };
            utterance.onerror = (err) => {
                console.error("Speech error:", err);
                state.isPlaying = false;
            };

            speechSynthesis.speak(utterance);
        }

        speechSynthesis.cancel(); // ensure clean start
        setTimeout(() => speakNextChunk(), 100);
    }

    // State for typing effect and stop generation
    let isTyping = false;
    let typingTimeout = null;
    let abortController = null;

    function isMobileDevice() {
        return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Toggle mobile sidebar
    hamburgerMenu.addEventListener('click', () => {
        mobileSidebar.classList.add('active');
        mobileSidebarOverlay.classList.add('active');
    });

    // User dropdown handling for both mobile and desktop
    const userAccountMobile = document.getElementById('user-account');
    const userDropdownMobile = document.getElementById('user-dropdown');
    const userAccountDesktop = document.getElementById('user-account-01');
    const userDropdownDesktop = document.getElementById('user-dropdown-01');

    // Toggle mobile dropdown
    userAccountMobile.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdownMobile.classList.toggle('active');
        userDropdownDesktop.classList.remove('active');
    });

    // Toggle desktop dropdown
    userAccountDesktop.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdownDesktop.classList.toggle('active');
        userDropdownMobile.classList.remove('active');
    });

    // Close both dropdowns on outside click
    document.addEventListener('click', (e) => {
        if (!userAccountMobile.contains(e.target) && !userDropdownMobile.contains(e.target)) {
            userDropdownMobile.classList.remove('active');
        }
        if (!userAccountDesktop.contains(e.target) && !userDropdownDesktop.contains(e.target)) {
            userDropdownDesktop.classList.remove('active');
        }
        // Close context menu on outside click
        const contextMenu = document.querySelector('.context-menu');
        if (contextMenu && !contextMenu.contains(e.target)) {
            contextMenu.remove();
        }
    });

    mobileSidebarOverlay.addEventListener('click', () => {
        mobileSidebar.classList.remove('active');
        mobileSidebarOverlay.classList.remove('active');
    });

    // Handle keyboard show/hide on mobile devices
    function handleKeyboardVisibility() {
        const inputArea = document.querySelector('.input-area');
        let originalHeight = window.innerHeight;

        chatInput.addEventListener('focus', () => {
            setTimeout(() => {
                inputArea.scrollIntoView({ behavior: 'smooth', block: 'end' });
                const newHeight = window.innerHeight;
                if (newHeight < originalHeight) {
                    inputArea.style.bottom = `${originalHeight - newHeight}px`;
                }
            }, 300);
        });

        chatInput.addEventListener('blur', () => {
            inputArea.style.bottom = '0';
        });

        window.addEventListener('resize', () => {
            const newHeight = window.innerHeight;
            if (newHeight > originalHeight) {
                inputArea.style.bottom = '0';
            } else {
                inputArea.style.bottom = `${originalHeight - newHeight}px`;
                inputArea.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
            originalHeight = newHeight;
        });
    }

    handleKeyboardVisibility();

    // Swipe to open/close
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX < 50 && touchEndX - touchStartX > 50) {
            mobileSidebar.classList.add('active');
            mobileSidebarOverlay.classList.add('active');
        } else if (touchStartX - touchEndX > 50) {
            mobileSidebar.classList.remove('active');
            mobileSidebarOverlay.classList.remove('active');
        }
    });

    // Handle mobile new chat button
    mobileNewChatBtn.addEventListener('click', () => {
        if (!activeChat || activeChat.messages.length > 0) {
            createNewChat();
            showChatInterface();
            mobileSidebar.classList.remove('active');
            mobileSidebarOverlay.classList.remove('active');
        } else {
            chatInput.focus();
        }
    });

    togglePinBtn.addEventListener('click', () => {
        expandedMenu.classList.toggle('pinned');
        const main = document.querySelector('.main');
        if (expandedMenu.classList.contains('pinned')) {
            main.classList.add('shifted-left');
        } else {
            main.classList.remove('shifted-left');
        }
    });

    // Chat state
    let currentModel = 'gpt-3.5';
    let allChats = [];
    let activeChat = null;
    let currentSection = 'home';
    const token = getToken(); // Retrieve JWT token

    function getToken() {
        const urlParams = new URLSearchParams(window.location.search);
        let token = urlParams.get('token');
        if (!token) {
            token = localStorage.getItem('jwt_token');
        }
        return token;
    }
    speechSynthesis.onvoiceschanged = setPreferredVoice;
    setPreferredVoice();

    // Fetch chats from backend
    async function fetchChats() {
        try {
            const response = await fetch('http://localhost:3000/api/chats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch chats');
            allChats = await response.json();
            updateChatHistoryUI();

            // Check for stored active chat ID
            const activeChatId = localStorage.getItem('activeChatId');
            let chatToLoad = null;

            // Only try to find chat if ID is valid
            if (activeChatId && activeChatId.match(/^[0-9a-fA-F]{24}$/)) {
                chatToLoad = allChats.find(chat => chat._id === activeChatId);
            }

            if (allChats.length > 0) {
                if (chatToLoad) {
                    // Load the previously active chat
                    loadChat(activeChatId);
                } else {
                    // Fallback to the first chat if the stored ID is invalid
                    loadChat(allChats[0]._id);
                }
            } else {
                createNewChat();
                showChatInterface();
            }
        } catch (error) {
            console.error('Error fetching chats:', error);
            alert('Failed to load chat history. Please try again.');
            createNewChat();
            showChatInterface();
        }
    }

    // Save chat to backend
    async function saveChatToBackend(chat, signal) {
        try {
            const response = await fetch('http://localhost:3000/api/emotional-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    input: chat.messages[chat.messages.length - 1].content,
                    chatId: chat._id || undefined // Only send chatId if it exists
                }),
                signal
            });
            if (!response.ok) throw new Error('Failed to save chat');
            const data = await response.json();
            chat._id = data.chatId;
            chat.messages.push({ role: 'bot', content: data.response });

            // Update activeChatId in localStorage if this is the active chat
            if (activeChat === chat) {
                localStorage.setItem('activeChatId', chat._id);
            }

            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Generation stopped by user');
            }
            console.error('Error saving chat:', error);
            throw error;
        }
    }

    // Delete chat from backend
    async function deleteChatFromBackend(chatId) {
        try {
            const response = await fetch(`http://localhost:3000/api/chats/${chatId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to delete chat');
            return true;
        } catch (error) {
            console.error('Error deleting chat:', error);
            throw error;
        }
    }

    // Update chat history list in the UI
    function updateChatHistoryUI() {
        chatHistoryList.innerHTML = '';
        mobileChatHistoryList.innerHTML = '';

        allChats.forEach(chat => {
            const historyItem = document.createElement('li');
            historyItem.className = `expanded-menu-item ${chat._id === activeChat?._id ? 'active' : ''}`;
            historyItem.dataset.id = chat._id;
            historyItem.style.display = 'flex';
            historyItem.style.flexDirection = 'column';
            historyItem.style.alignItems = 'flex-start';
            historyItem.style.gap = '4px';
            historyItem.style.padding = '10px 16px';
            historyItem.style.cursor = 'pointer';
            historyItem.style.height = '50px';

            const mobileHistoryItem = historyItem.cloneNode(true);

            const clickHandler = () => {
                loadChat(chat._id);
                showChatInterface();
                mobileSidebar.classList.remove('active');
                mobileSidebarOverlay.classList.remove('active');
            };
            historyItem.addEventListener('click', clickHandler);
            mobileHistoryItem.addEventListener('click', clickHandler);

            const titleSpan = document.createElement('span');
            titleSpan.textContent = chat.title || "Untitled Chat";
            titleSpan.style.fontWeight = 'bold';
            titleSpan.style.fontSize = '12px';
            titleSpan.style.width = '100%';

            const mobileTitleSpan = titleSpan.cloneNode(true);

            const lastMsg = chat.messages?.length > 0 ? chat.messages[chat.messages.length - 1].content : 'No messages yet';
            const preview = document.createElement('div');
            preview.textContent = lastMsg.slice(0, 40) + (lastMsg.length > 40 ? '...' : '');
            preview.style.fontSize = '10px';
            preview.style.color = '#666';
            preview.style.width = '100%';

            const mobilePreview = preview.cloneNode(true);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.style.alignSelf = 'flex-end';
            deleteBtn.style.marginTop = '-30px';
            deleteBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M10 11v6M14 11v6M4 6h16v14a1 1 0 01-1 1H5a1 1 0 01-1-1V6z"/>
                </svg>
            `;
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteChat(chat._id);
            });

            const mobileDeleteBtn = deleteBtn.cloneNode(true);
            mobileDeleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteChat(chat._id);
            });

            historyItem.appendChild(titleSpan);
            historyItem.appendChild(preview);
            historyItem.appendChild(deleteBtn);
            chatHistoryList.appendChild(historyItem);

            mobileHistoryItem.appendChild(mobileTitleSpan);
            mobileHistoryItem.appendChild(mobilePreview);
            mobileHistoryItem.appendChild(mobileDeleteBtn);
            mobileChatHistoryList.appendChild(mobileHistoryItem);
        });
    }

    // Delete a chat
    async function deleteChat(chatId) {
        if (!confirm(`Are you sure you want to permanently delete the chat "${allChats.find(c => c._id === chatId).title}"?`)) {
            return;
        }

        try {
            await deleteChatFromBackend(chatId);
            allChats = allChats.filter(chat => chat._id !== chatId);

            if (activeChat && activeChat._id === chatId) {
                // Clear activeChatId from localStorage
                localStorage.removeItem('activeChatId');
                activeChat = null;
                chatArea.innerHTML = '';
                if (allChats.length > 0) {
                    loadChat(allChats[0]._id);
                } else {
                    createNewChat();
                    showChatInterface();
                }
            }

            updateChatHistoryUI();
        } catch (error) {
            alert('Failed to delete chat. Please try again.');
        }
    }

    // Create a new chat
    function createNewChat() {
        const newChat = {
            _id: null,
            title: "New Chat",
            messages: [],
            model: currentModel
        };

        allChats.unshift(newChat);
        activeChat = newChat;
        chatArea.innerHTML = '';
        chatArea.appendChild(welcomeScreen);
        welcomeScreen.style.display = 'flex';
        updateChatHistoryUI();

        // Save the new chat as active (null until saved to backend)
        localStorage.setItem('activeChatId', newChat._id || 'new');

        return newChat._id;
    }

    // Load a specific chat
    // In ChatUI.js
    async function loadChat(chatId) {
        const chat = allChats.find(c => c._id === chatId);
        if (!chat) return;

        activeChat = chat;
        currentModel = chat.model;
        updateModelUI();

        // Save the active chat ID to localStorage
        localStorage.setItem('activeChatId', chatId);

        chatArea.innerHTML = '';
        if (chat.messages.length > 0) {
            welcomeScreen.style.display = 'none';
            chat.messages.forEach(msg => {
                const role = msg.sender === 'user' ? 'user' : 'bot';
                const displayContent = msg.content === "User shared an image." && msg.image ? '' : msg.content;
                addMessageToUI(role, displayContent, false, msg.image);
            });
        } else {
            chatArea.appendChild(welcomeScreen);
            welcomeScreen.style.display = 'flex';
        }

        updateChatHistoryUI();
        if (!isMobileDevice()) {
            chatInput.focus();
        }
    }
    // Update model selection UI
    function updateModelUI() {
        modelOptions.forEach(option => {
            if (option.getAttribute('data-model') === currentModel) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }

    // Rename the current chat based on first message
    function updateChatTitle(newTitle) {
        if (!activeChat) return;
        activeChat.title = newTitle || "New Chat";
        updateChatHistoryUI();
    }

    // Adjust input height based on content
    function adjustInputHeight() {
        chatInput.style.height = 'auto';
        chatInput.style.height = (chatInput.scrollHeight) + 'px';
    }

    // Add a message to the UI with optional typing effect
    // In ChatUI.js, inside addMessageToUI function
    function addMessageToUI(role, content, useTypingEffect = false, imageUrl = null) {
        const messageContainer = document.createElement('div');
        messageContainer.className = `message-container ${role === 'user' ? 'user' : 'bot'}-message`;

        const messageWrapper = document.createElement('div');
        messageWrapper.className = 'message-wrapper';

        const avatar = document.createElement('div');
        avatar.className = 'avatar';

        if (role === 'user') {
            avatar.textContent = '';
        } else if (!isMobileDevice()) {
            avatar.innerHTML = `
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z" fill="#4CAF50" stroke="#4CAF50" />
                <path d="M5 3L5.5 5L7 5.5L5.5 6L5 8L4.5 6L3 5.5L4.5 5L5 3Z" fill="#81C784" stroke="#4CAF50" />
                <path d="M17 16L17.3 17.5L18.5 18L17.3 18.5L17 20L16.7 18.5L15.5 18L16.7 17.5L17 16Z" fill="#81C784" stroke="#4CAF50" />
            </svg>
        `;
        }

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        // Add image if it exists (for user messages)
        if (imageUrl && role === 'user') {
            const imgElement = document.createElement('img');
            imgElement.src = imageUrl;
            imgElement.style.maxWidth = '200px'; // Adjust size for chat UI
            imgElement.style.maxHeight = '200px';
            imgElement.style.borderRadius = '8px';
            imgElement.style.marginBottom = '8px';
            messageContent.appendChild(imgElement);
        }

        // Add text content only if it exists
        if (content) {
            if (useTypingEffect && role === 'bot') {
                messageContent.textContent = '';
                let index = 0;
                isTyping = true;

                function typeCharacter() {
                    if (!isTyping || index >= content.length) {
                        isTyping = false;
                        clearTimeout(typingTimeout);
                        return;
                    }
                    messageContent.textContent += content[index];
                    index++;
                    chatArea.scrollTop = chatArea.scrollHeight;
                    typingTimeout = setTimeout(typeCharacter, 20);
                }

                typeCharacter();
            } else {
                messageContent.textContent = content;
            }
        }

        if (avatar.innerHTML || role === 'user') {
            messageWrapper.appendChild(avatar);
        }
        messageWrapper.appendChild(messageContent);
        messageContainer.appendChild(messageWrapper);

        if (role === 'bot') {
            const speakerButton = document.createElement('button');
            speakerButton.className = 'speaker-button';
            speakerButton.title = 'Read Aloud';
            speakerButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9v6h4l5 5V4l-5 5H3z" />
                <path d="M16 8c2.2 1.6 2.2 4.4 0 6" />
                <path d="M18 6c3.3 2.4 3.3 5.6 0 8" />
            </svg>
        `;
            speakerButton.addEventListener('click', () => toggleSpeech(messageContainer, content));
            messageContainer.appendChild(speakerButton);
        }

        chatArea.appendChild(messageContainer);
        chatArea.scrollTop = chatArea.scrollHeight;

        return messageContainer;
    }
    // Show context menu for user messages


    // Edit a user message
    function editMessage(messageContainer, originalContent) {
        const messageContent = messageContainer.querySelector('.message-content');
        const input = document.createElement('textarea');
        input.value = originalContent;
        input.style.width = '100%';
        input.style.minHeight = '50px';
        input.style.resize = 'vertical';

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.style.marginTop = '5px';

        messageContent.innerHTML = '';
        messageContent.appendChild(input);
        messageContent.appendChild(saveButton);

        saveButton.addEventListener('click', async () => {
            const editedContent = input.value.trim();
            if (editedContent) {
                // Remove original message from activeChat
                const messageIndex = activeChat.messages.findIndex(msg => msg.content === originalContent && msg.sender === 'user');
                if (messageIndex !== -1) {
                    activeChat.messages.splice(messageIndex, 1);
                }

                // Update UI
                messageContent.textContent = editedContent;
                activeChat.messages.push({ sender: 'user', content: editedContent });
                chatArea.scrollTop = chatArea.scrollHeight;

                // Send edited message as new prompt
                showTypingIndicator();
                abortController = new AbortController();
                try {
                    const response = await fetch('http://localhost:3000/api/emotional-chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            input: editedContent,
                            chatId: activeChat._id
                        }),
                        signal: abortController.signal
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to get AI response');
                    }

                    const data = await response.json();
                    removeTypingIndicator();

                    if (data.isTechnicalRedirect) {
                        activeChat.messages.push({ sender: 'bot', content: data.response });
                        addMessageToUI('bot', data.response, true);
                    } else {
                        activeChat._id = data.chatId;
                        activeChat.messages.push({ sender: 'bot', content: data.response });
                        addMessageToUI('bot', data.response, true);

                        const chatIndex = allChats.findIndex(c => c === activeChat);
                        if (chatIndex !== -1) {
                            allChats[chatIndex] = activeChat;
                        } else {
                            allChats.unshift(activeChat);
                        }
                        updateChatHistoryUI();
                    }
                } catch (error) {
                    removeTypingIndicator();
                    const errorMessage = `Error: ${error.message}`;
                    activeChat.messages.push({ sender: 'bot', content: errorMessage });
                    addMessageToUI('bot', errorMessage, false);
                    console.error('Error sending edited message:', error);
                }
            }
        });
    }

    // Show typing indicator with stop button
    function showTypingIndicator() {
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container bot-message typing-indicator-container';
        messageContainer.id = 'typing-indicator';

        const messageWrapper = document.createElement('div');
        messageWrapper.className = 'message-wrapper';

        const avatar = document.createElement('div');
        avatar.className = 'avatar';

        if (!isMobileDevice()) {
            avatar.innerHTML = `
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="1.5"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z" fill="#4CAF50" stroke="#4CAF50" />
                    <path d="M5 3L5.5 5L7 5.5L5.5 6L5 8L4.5 6L3 5.5L4.5 5L5 3Z" fill="#81C784" stroke="#4CAF50" />
                    <path d="M17 16L17.3 17.5L18.5 18L17.3 18.5L17 20L16.7 18.5L15.5 18L16.7 17.5L17 16Z" fill="#81C784"
                        stroke="#4CAF50" />
                </svg>
            `;
        }

        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message-content';
        typingIndicator.textContent = 'Generating...';



        if (avatar.innerHTML) {
            messageWrapper.appendChild(avatar);
        }
        messageWrapper.appendChild(typingIndicator);
        messageContainer.appendChild(messageWrapper);

        chatArea.appendChild(messageContainer);
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    // Remove typing indicator
    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // Stop generation
    function stopGeneration() {
        if (abortController) {
            abortController.abort();
            abortController = null;
        }
        isTyping = false;
        clearTimeout(typingTimeout);
        removeTypingIndicator();
        if (currentSpeech) {
            window.speechSynthesis.cancel();
            currentSpeech = null;
            speechStates.forEach((state, messageId) => {
                state.isPlaying = false;
                const container = document.querySelector(`[data-message-id="${messageId}"]`);
                if (container) {
                    const button = container.querySelector('.speaker-button');
                    if (button) {
                        button.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 3v18l15-9z" />
                        </svg>
                    `;
                    }
                }
            });
            speechStates.clear();
        }
        const lastBotMessage = activeChat.messages[activeChat.messages.length - 1];
        if (lastBotMessage && lastBotMessage.role === 'bot' && lastBotMessage.content === '') {
            activeChat.messages.pop();
        }
    }
    // Handle sending a message
    async function sendMessage() {
        const message = chatInput.value.trim();
        const imagePreview = document.querySelector('.image-preview-container');
        let imageUrl = null;
        let file = fileInput.files[0];

        // If there's no message and no image, return
        if (!message && !file) return;

        welcomeScreen.style.display = 'none';
        if (welcomeScreen.parentNode === chatArea) {
            chatArea.removeChild(welcomeScreen);
        }

        // Get image URL if an image is selected
        if (imagePreview && file) {
            const img = imagePreview.querySelector('.image-preview');
            imageUrl = img.src; // Use the data URL from FileReader for now
        }

        // Construct prompt for the backend
        let prompt = message;
        if (file && !message) {
            prompt = "User shared an image."; // Default prompt if only image is provided
        }

        // Add user message to UI (with image if present)
        activeChat.messages.push({ sender: 'user', content: prompt, image: imageUrl });
        // Display the message (if present) and the image (if present)
        const displayContent = message || (imageUrl ? '' : 'Shared an image');
        addMessageToUI('user', displayContent, false, imageUrl);

        // Clear input and image preview
        chatInput.value = '';
        adjustInputHeight();
        if (imagePreview) {
            imagePreview.remove();
        }
        fileInput.value = '';

        if (activeChat.messages.length === 1) {
            const firstFewWords = message ? message.split(' ').slice(0, 5).join(' ') + (message.split(' ').length > 5 ? '...' : '') : 'Image shared';
            updateChatTitle(firstFewWords);
        }

        showTypingIndicator();
        abortController = new AbortController();

        try {
            const formData = new FormData();
            formData.append('input', prompt);
            if (file) {
                formData.append('image', file);
            }
            formData.append('chatId', activeChat._id);

            const response = await fetch('http://localhost:3000/api/emotional-chat', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
                signal: abortController.signal
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to get AI response');
            }

            const data = await response.json();
            removeTypingIndicator();

            // Update the image URL with the one returned from the backend (if available)
            if (data.imageUrl) {
                const lastUserMessage = activeChat.messages[activeChat.messages.length - 1];
                if (lastUserMessage.sender === 'user' && lastUserMessage.image) {
                    lastUserMessage.image = data.imageUrl; // Update with the backend URL
                    // Update the UI to reflect the new image URL
                    const lastMessageContainer = chatArea.lastElementChild;
                    if (lastMessageContainer && lastMessageContainer.classList.contains('user-message')) {
                        const imgElement = lastMessageContainer.querySelector('.message-content img');
                        if (imgElement) {
                            imgElement.src = data.imageUrl;
                        }
                    }
                }
            }

            if (data.isTechnicalRedirect) {
                activeChat.messages.push({ sender: 'bot', content: data.response });
                addMessageToUI('bot', data.response, true);
            } else {
                activeChat._id = data.chatId;
                activeChat.messages.push({ sender: 'bot', content: data.response });
                addMessageToUI('bot', data.response, true);

                const chatIndex = allChats.findIndex(c => c === activeChat);
                if (chatIndex !== -1) {
                    allChats[chatIndex] = activeChat;
                } else {
                    allChats.unshift(activeChat);
                }
                updateChatHistoryUI();
            }

            // Handle happy moments if returned
            if (data.happyMomentStored) {
                console.log('Happy moment stored:', data.happyMomentStored);
            }
            if (data.pastHappyMoments && data.pastHappyMoments.length > 0) {
                const pastMomentsMessage = "I noticed you might be feeling down. Here are some happy moments to lift your spirits:\n" +
                    data.pastHappyMoments.map(m => `- ${m.content} (${new Date(m.date).toLocaleDateString()})`).join('\n');
                activeChat.messages.push({ sender: 'bot', content: pastMomentsMessage });
                addMessageToUI('bot', pastMomentsMessage, true);
            }
        } catch (error) {
            removeTypingIndicator();
            const errorMessage = `Error: ${error.message}`;
            activeChat.messages.push({ sender: 'bot', content: errorMessage });
            addMessageToUI('bot', errorMessage, false);
            console.error('Error sending message:', error);
        } finally {
            abortController = null;
        }
    }


    // Show chat interface
    function showChatInterface() {
        currentSection = 'home';
        updateNavUI();
        pageContent.innerHTML = '';
        pageContent.appendChild(chatInterface);
        if (activeChat) {
            loadChat(activeChat._id);
        } else {
            createNewChat();
        }
    }

    // Show DreamSpace page
    function showDreamSpacePage() {
        currentSection = 'dream-space';
        updateNavUI();

        pageContent.innerHTML = `
        <div class="model-selector">
            <div class="model-option active" data-model="noira" id="NoiraModel" style='background-color:white;'>Noira</div>
            <div class="model-option" data-model="dreamcraft" id="DreamCraftModel" title="DreamCraft">DreamCraft</div>
        </div>
        <div class="dreamspace-page" id='Open'>
            <h2>DreamCraft</h2>
            <p>Unleash your creativity with AI-powered brainstorming tools. Generate ideas, create stories, or explore new concepts.</p>
            <button onclick="alert('Start Brainstorming!')">Get Started</button>
        </div>
    `;

        mobileSidebar.classList.remove('active');
        mobileSidebarOverlay.classList.remove('active');

        // ✅ Add click listeners for dynamically injected buttons
        const noiraModel = document.getElementById('NoiraModel');
        const dreamCraftModel = document.getElementById('DreamCraftModel');

        noiraModel.addEventListener('click', () => {
            showChatInterface(); // Your home/chat UI
            updateModelUI();
        });

        dreamCraftModel.addEventListener('click', () => {
            showDreamSpacePage(); // Re-initialize
            updateModelUI();
        });
    }


    // Show SoulSafe page
function showSoulSafePage() {
    currentSection = 'soul-safe';
    updateNavUI();

    pageContent.innerHTML = `
    <div class="model-selector">
        <div class="model-option active" data-model="noira" id="NoiraModel">Noira</div>
        <div class="model-option" data-model="dreamcraft" id="DreamCraftModel" title="DreamCraft">DreamCraft</div>
    </div>
    <div class="soulsafe-page">
        <h2>SoulSafe: Your Happy Moments</h2>
        <p>A treasure chest of your happiest memories.</p>
        <div class="moments-container" id="moments-container"></div>
    </div>
    `;

    // Sample data for moments (combined from all sources)
    const happyMoments = JSON.parse(localStorage.getItem('happyMoments')) || [
        { type: "dreamcraft", content: "Image Creation", image: "https://via.placeholder.com/150", date: "2025-05-10" },
        { type: "dreamcraft", content: "Comic Book", image: "https://via.placeholder.com/150?text=Comic+Book", date: "2025-05-12" },
        { type: "story", content: "A heartwarming story about friendship.", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", date: "2025-05-11" },
        { type: "story", content: "A thrilling adventure tale!", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", date: "2025-05-13" },
        { type: "chatai", content: "AI: You’re doing great today! Keep it up!", date: "2025-05-09" },
        { type: "chatai", content: "User: I had a tough day... AI: I’m here for you!", date: "2025-05-14" }
    ];

    // Icons for each moment type
    const icons = {
        dreamcraft: `<svg class="moment-icon" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
            <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z" />
        </svg>`,
        story: `<svg class="moment-icon" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2h11A2.5 2.5 0 0 1 20 4.5v15a2 2 0 0 1-1.3 1.9 2 2 0 0 1-2.2-.4l-2.5-2.1-2.5 2.1a2 2 0 0 1-2.5 0l-2.5-2.1-2.5 2.1A2 2 0 0 1 4 19.5z"/>
        </svg>`,
        chatai: `<svg class="moment-icon" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>`
    };

    // Function to create a flip card for a moment
    function createMomentCard(moment) {
        const card = document.createElement('div');
        card.className = 'moment-card';

        const momentTitle = moment.type === 'dreamcraft' ? moment.content :
                           moment.type === 'story' ? 'Story Moment' : 'Chat Moment';

        card.innerHTML = `
        <div class="moment-card-inner">
            <!-- Front Face -->
            <div class="moment-card-front">
                ${icons[moment.type]}
                <h4>${momentTitle}</h4>
                <small>${new Date(moment.date).toLocaleDateString()}</small>
            </div>
            <!-- Back Face -->
            <div class="moment-card-back">
                <h4>${momentTitle}</h4>
                <small>${new Date(moment.date).toLocaleDateString()}</small>
                ${
                    moment.type === 'dreamcraft' ? `<img src="${moment.image}" alt="${moment.content}"/>` :
                    moment.type === 'story' ? `
                        <p>${moment.content}</p>
                        <audio controls><source src="${moment.audio}" type="audio/mp3">Your browser does not support the audio element.</audio>
                    ` :
                    `<p>${moment.content}</p>`
                }
            </div>
        </div>
        `;

        card.addEventListener('click', () => {
            const inner = card.querySelector('.moment-card-inner');
            const isFlipped = inner.style.transform === 'rotateY(180deg)';
            inner.style.transform = isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)';
        });

        return card;
    }

    // Render all moments in a single section
    const momentsContainer = document.getElementById('moments-container');
    if (happyMoments.length === 0) {
        momentsContainer.innerHTML = '<p class="no-moments">No happy moments yet.</p>';
    } else {
        happyMoments.forEach(moment => {
            const card = createMomentCard(moment);
            momentsContainer.appendChild(card);
        });
    }

    mobileSidebar.classList.remove('active');
    mobileSidebarOverlay.classList.remove('active');

    // Add event listeners for dynamically injected model buttons
    const noiraModel = document.getElementById('NoiraModel');
    const dreamCraftModel = document.getElementById('DreamCraftModel');

    noiraModel.addEventListener('click', () => {
        showChatInterface();
        updateModelUI();
    });

    dreamCraftModel.addEventListener('click', () => {
        showDreamSpacePage();
        updateModelUI();
    });
}


    // Update navigation UI
    function updateNavUI() {
        navLinks.forEach(link => {
            const section = link.getAttribute('data-section');
            if (section === currentSection) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Event Listeners
    chatInput.addEventListener('input', adjustInputHeight);
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

 modelOptions.forEach(option => {
    option.addEventListener('click', () => {
        modelOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');

        const selectedModel = option.getAttribute('data-model');
        if (selectedModel === 'noira') {
            currentModel = 'noira';
            showChatInterface();
        } else if (selectedModel === 'dreamcraft') {
            currentModel = 'dreamcraft';
            window.location.href = 'DreamCraft.html'; // Redirect to the new page
        }

        if (activeChat) {
            activeChat.model = currentModel;
        }
    });
});


    addBtn.addEventListener('click', () => {
        if (!activeChat || activeChat.messages.length > 0) {
            createNewChat();
            showChatInterface();
            if (!isMobileDevice()) {
                chatInput.focus();
            }
        } else {
            if (!isMobileDevice()) {
                chatInput.focus();
            }
        }
    });

    exampleCards.forEach(card => {
        card.addEventListener('click', () => {
            const exampleText = card.querySelector('.example-title').textContent;
            chatInput.value = exampleText;
            adjustInputHeight();
            chatInput.focus();
        });
    });

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const section = link.getAttribute('data-section');
        if (section === 'home') {
            e.preventDefault();
            showChatInterface();
        } else if (section === 'soul-safe') {
            e.preventDefault();
            showSoulSafePage();
        }
        // Remove dream-space case since it's handled by href
    });
});

    // Add this at the top of your ChatUI.js with other DOM element declarations
    const micOverlay = document.getElementById('mic-overlay');
    const micIcon = document.getElementById('mic-icon');
    const micStatus = document.getElementById('mic-status');
    const micStopButton = document.getElementById('mic-stop-button');

    // Add this with your other state variables
    let recognition = null;
    let isListening = false;
    let silenceTimeout = null;
    const SILENCE_DURATION = 3000; // Stop listening after 3 seconds of silence

    // Function to initialize speech recognition
    function initializeSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Speech recognition is not supported in your browser. Try Chrome or Edge.');
            return false;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();

        recognition.continuous = true; // Changed to true for continuous listening
        recognition.interimResults = true;
        recognition.lang = 'en-US'; // Default language, can be changed based on user preference

        recognition.onstart = () => {
            isListening = true;
            micIcon.classList.add('listening');
            micStatus.textContent = 'Listening...';
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            if (event.error === 'no-speech') {
                micStatus.textContent = 'No speech detected';
                stopListening();
            } else {
                micStatus.textContent = `Error: ${event.error}`;
                stopListening();
            }
        };

        recognition.onend = () => {
            if (isListening) {
                // Restart recognition to continue listening
                try {
                    recognition.start();
                } catch (error) {
                    console.error('Failed to restart recognition:', error);
                    stopListening();
                }
            } else {
                stopListening();
            }
        };

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');

            // Reset silence timeout on receiving any result
            clearTimeout(silenceTimeout);
            silenceTimeout = setTimeout(() => {
                if (isListening) {
                    micStatus.textContent = 'No speech detected';
                    stopListening();
                }
            }, SILENCE_DURATION);

            // Update status with interim or final results
            if (event.results[event.results.length - 1].isFinal) {
                chatInput.value = transcript;
                adjustInputHeight();
                micStatus.textContent = 'Processing...';
                // Optionally stop listening after final result
                // stopListening(); // Uncomment if you want to stop after each final result
            } else {
                micStatus.textContent = `Listening: ${transcript}`;
            }
        };

        return true;
    }

    // Add this function to start listening
    function startListening() {
        if (!recognition && !initializeSpeechRecognition()) {
            return;
        }

        micOverlay.classList.add('active');
        try {
            recognition.start();
            // Start silence detection
            silenceTimeout = setTimeout(() => {
                if (isListening) {
                    micStatus.textContent = 'No speech detected';
                    stopListening();
                }
            }, SILENCE_DURATION);
        } catch (error) {
            console.error('Speech recognition start failed:', error);
            micStatus.textContent = 'Failed to start listening';
            stopListening();
        }
    }

    // Add this function to stop listening
    function stopListening() {
        isListening = false;
        if (recognition) {
            try {
                recognition.stop();
            } catch (error) {
                console.error('Error stopping recognition:', error);
            }
        }
        clearTimeout(silenceTimeout);
        micIcon.classList.remove('listening');
        micOverlay.classList.remove('active');
        micStatus.textContent = 'Tap microphone to start';
    }

    // Update the micButton event listener
    micButton.addEventListener('click', () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    });
    micOverlay.addEventListener('click', (e) => {
        // Only stop listening if clicking outside the mic-container
        if (e.target === micOverlay) {
            stopListening();
        }
    });
    // Add event listener for the stop button in the overlay
    micStopButton.addEventListener('click', stopListening);

    voiceAssistantButton.addEventListener('click', () => {
        alert('Voice Assistant feature is not implemented yet.');
    });

    // Initialize
    function initializeApp() {


        // Use an account-specific key for hasSeenWelcome
        const welcomeKey = `hasSeenWelcome_${userEmail}`;
        const hasSeenWelcome = localStorage.getItem(welcomeKey);

        if (!hasSeenWelcome) {
            // Show welcome page for the first time after login
            showWelcomePage();
            // Set flag to prevent showing again until logout
            localStorage.setItem(welcomeKey, 'true');
        } else {
            // Skip welcome page and show chat interface directly
            chatInterface.style.display = 'flex';
            fetchChats();
        }

       
    }


    // Profile Picture Selection
    const profilePictureOptions = document.getElementById('profile-picture-options');
    const profilePicturePreview = document.getElementById('profile-picture-preview');

    // Default profile pictures (replace with your own image URLs)
    const defaultProfilePictures = [
        'assets/M1.jpg',
        'assets/G-1.jpg',
        'assets/m2.jpg',
        'assets/G-2.jpg',
        'assets/new1.jpg',
        'assets/new2.jpg',
    ];

    // Populate profile picture options
    function populateProfilePictures() {
        defaultProfilePictures.forEach((src, index) => {
            const img = document.createElement('img');
            img.src = src;
            img.className = 'profile-picture-option';
            img.dataset.index = index;
            img.alt = `Profile Picture ${index + 1}`;
            profilePictureOptions.appendChild(img);

            img.addEventListener('click', () => {
                // Remove active class from all options
                document.querySelectorAll('.profile-picture-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                // Add active class to selected option
                img.classList.add('active');
                // Update preview
                profilePicturePreview.src = src;
                localStorage.setItem('profilePicture', src);
            });
        });

        // Set default profile picture (first one or saved one)
        const savedPicture = localStorage.getItem('profilePicture');
        if (savedPicture && defaultProfilePictures.includes(savedPicture)) {
            profilePicturePreview.src = savedPicture;
            const activeOption = document.querySelector(`.profile-picture-option[src="${savedPicture}"]`);
            if (activeOption) activeOption.classList.add('active');
        } else {
            profilePicturePreview.src = defaultProfilePictures[0];
            document.querySelector('.profile-picture-option[data-index="0"]').classList.add('active');
        }
    }

    // Call this function when initializing preferences
    populateProfilePictures();



    function setupButtonGroup(buttons, onSelect) {
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                buttons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                if (onSelect) onSelect(button.dataset.value);
            });
        });
    }

    setupButtonGroup(genderButtons);
    setupButtonGroup(assistantButtons, value => {
        currentModel = value; // Update assistant type
    });
    setupButtonGroup(languageButtons, value => {
        if (recognition) {
            recognition.lang = value === 'en' ? 'en-US' : value === 'hi' ? 'hi-IN' : 'mr-IN';
        }
    });

    // Close modal
    function closeModal() {
        personalizeModal.classList.remove('active');
        successMessage.style.display = 'none';
        errorMessage.style.display = 'none';
    }
    personalizeModal.addEventListener('click', (e) => {
        if (e.target === personalizeModal) {
            closeModal();
        }
    });
    closeModalButton.addEventListener('click', closeModal);
    cancelPreferencesButton.addEventListener('click', closeModal);

    // Close modal when clicking outside
    personalizeModal.addEventListener('click', (e) => {
        if (e.target === personalizeModal) {
            closeModal();
        }
    });

    // Save preferences
    savePreferencesButton.addEventListener('click', () => {
        const name = userNameInput.value.trim();
        const gender = Array.from(genderButtons).find(btn => btn.classList.contains('active'))?.dataset.value || '';
        const assistantType = Array.from(assistantButtons).find(btn => btn.classList.contains('active'))?.dataset.value || '';
        const language = Array.from(languageButtons).find(btn => btn.classList.contains('active'))?.dataset.value || '';
        const profilePicture = profilePicturePreview.src;

        // Validate all fields
        if (!name || !gender || !assistantType || !language || !profilePicture) {
            errorMessage.style.display = 'block';
            successMessage.style.display = 'none';
            return;
        }

        // Validate name
        if (!/^[a-zA-Z\s]{1,50}$/.test(name)) {
            errorMessage.textContent = 'Please enter a valid name (letters and spaces only, up to 50 characters).';
            errorMessage.style.display = 'block';
            successMessage.style.display = 'none';
            return;
        }

        // Apply assistant type
        currentModel = assistantType;

        // Apply language for speech recognition
        if (recognition && language) {
            recognition.lang = language === 'en' ? 'en-US' : language === 'hi' ? 'hi-IN' : 'mr-IN';
        }

        // Save to localStorage
        localStorage.setItem('userName', name);
        localStorage.setItem('gender', gender);
        localStorage.setItem('assistantType', assistantType);
        localStorage.setItem('language', language);
        localStorage.setItem('profilePicture', profilePicture);

        // Update user account images
        document.querySelectorAll('.user-account img').forEach(img => {
            img.src = profilePicture;
        });

        // Show success message
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';

        // Close modal after 2 seconds
        setTimeout(closeModal, 2000);
    });
    // Load saved preferences on initialization
    function loadPreferences() {
        const name = localStorage.getItem('userName') || '';
        const gender = localStorage.getItem('gender') || '';
        const assistantType = localStorage.getItem('assistantType') || 'female';
        const language = localStorage.getItem('language') || 'en';
        const profilePicture = localStorage.getItem('profilePicture') || defaultProfilePictures[0];

        userNameInput.value = name;
        profilePicturePreview.src = profilePicture;

        genderButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.value === gender));
        assistantButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.value === assistantType));
        languageButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.value === language));

        // Apply preferences
        currentModel = assistantType;
        if (recognition) {
            recognition.lang = language === 'en' ? 'en-US' : language === 'hi' ? 'hi-IN' : 'mr-IN';
        }
    }

    // Call loadPreferences after initializeApp
    initializeApp();
    loadPreferences();


    // Initialize
    fetchChats();

    function handleLogout() {
        // Clear the welcome page flag
        localStorage.removeItem('hasSeenWelcome');
        // Clear JWT token or other session data
        localStorage.removeItem('jwt_token');
        // Redirect to login page
        window.location.href = 'loginPage.html';
    }




});