document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const codeInput = document.getElementById('codeInput');
    const codeInputContainer = document.querySelector('.code-input-container');
    const toggleInputBtn = document.querySelector('.toggle-input-btn');

    toggleInputBtn.addEventListener('click', () => {
        codeInputContainer.classList.toggle('open');
        toggleInputBtn.style.transform = codeInputContainer.classList.contains('open')
            ? 'translateY(-50%) rotate(180deg)'
            : 'translateY(-50%)';
    });
    const editorPanel = document.querySelector('.editor-panel');
    const closeEditor = document.querySelector('.close-editor');
    const saveChanges = document.getElementById('saveChanges');
    const resetChanges = document.getElementById('resetChanges');
    const rolesContainer = document.getElementById('rolesContainer');
    const addRoleBtn = document.getElementById('addRoleBtn');
    const toast = document.getElementById('toast');

    // Initial state
    let originalState = {
        nickname: document.querySelector('.nickname').textContent,
        nicknameColor1: getComputedStyle(document.querySelector('.nickname')).color,
        nicknameColor2: getComputedStyle(document.querySelector('.nickname')).color,
        banner: document.querySelector('.banner').style.backgroundImage,
        avatar: document.querySelector('.avatar').style.backgroundImage,
        roles: Array.from(document.querySelectorAll('.role')).map(role => ({
            name: role.textContent,
            color: getComputedStyle(role).backgroundColor
        })),
        info: Array.from(document.querySelector('.info').children).map(p => p.innerHTML)
    };

    // Load saved state from server
    fetch('/api/settings')
        .then(response => response.json())
        .then(state => {
            if (Object.keys(state).length > 0) {
                applyState(state);
            }
        });

    // Snow effect
    let snowflakes = [];
    let isSnowing = false;
    let snowEmoji = '❄️';
    let snowInterval;

    function createSnowflake() {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.style.left = Math.random() * 100 + 'vw';
        snowflake.style.animationDuration = (Math.random() * 3 + 2) + 's'; // Between 2-5s
        snowflake.style.opacity = Math.random();
        snowflake.textContent = snowEmoji;
        document.body.appendChild(snowflake);

        // Remove snowflake after animation
        snowflake.addEventListener('animationend', () => {
            snowflake.remove();
        });
    }

    function toggleSnow(enabled) {
        if (enabled && !snowInterval) {
            isSnowing = true;
            snowInterval = setInterval(createSnowflake, 200);
        } else if (!enabled && snowInterval) {
            isSnowing = false;
            clearInterval(snowInterval);
            snowInterval = null;
            // Remove all existing snowflakes
            document.querySelectorAll('.snowflake').forEach(flake => flake.remove());
        }
    }


    // Event Listeners
    codeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const code = codeInput.value.toLowerCase();
            if (code === 'debug') {
                editorPanel.classList.add('open');
                populateEditor();
                codeInput.value = '';
                showToast('Режим редактирования активирован');
            } else {
                showToast('Неверный код');
            }
        }
    });

    closeEditor.addEventListener('click', () => {
        editorPanel.classList.remove('open');
    });

    // Populate editor with current values
    function populateEditor() {
        const nickname = document.querySelector('.nickname');
        const banner = document.querySelector('.banner');
        const avatar = document.querySelector('.avatar');
        const info = document.querySelector('.info');

        if (document.getElementById('nicknameInput')) {
            document.getElementById('nicknameInput').value = nickname.textContent;
            // Get current gradient colors from nickname
            const nicknameStyle = getComputedStyle(nickname);
            const nicknameGradient = nicknameStyle.backgroundImage;
            const nicknameColors = nicknameGradient.match(/rgb\([^)]+\)/g) || ['rgb(255,69,0)', 'rgb(255,215,0)'];
            document.getElementById('nicknameColor1').value = rgbToHex(nicknameColors[0]);
            document.getElementById('nicknameColor2').value = rgbToHex(nicknameColors[1] || nicknameColors[0]);
        }
        if (document.getElementById('bannerInput')) {
            document.getElementById('bannerInput').value = banner.style.backgroundImage.replace(/url\(['"](.+)['"]\)/, '$1') || '';
        }
        if (document.getElementById('avatarInput')) {
            document.getElementById('avatarInput').value = avatar.style.backgroundImage.replace(/url\(['"](.+)['"]\)/, '$1') || '';
        }

        // Keep existing role colors
        rolesContainer.innerHTML = '';
        document.querySelectorAll('.role').forEach(role => {
            const roleStyle = getComputedStyle(role);
            const roleGradient = roleStyle.backgroundImage;
            const roleColors = roleGradient.match(/rgb\([^)]+\)/g) || ['rgb(255,69,0)', 'rgb(255,215,0)'];
            addRoleToEditor(role.textContent, rgbToHex(roleColors[0]), rgbToHex(roleColors[1] || roleColors[0]));
        });

        // Populate info
        if (document.getElementById('infoInput')) {
            document.getElementById('infoInput').value = Array.from(info.children)
                .map(p => p.innerHTML).join('\n');
        }

        if (document.getElementById('snowToggle')) {
            document.getElementById('snowToggle').checked = isSnowing;
            document.getElementById('snowEmoji').value = snowEmoji;
        }
    }

    // Add new role
    addRoleBtn.addEventListener('click', () => {
        addRoleToEditor('Новая роль', '#FF4500', '#FFD700');
    });

    function addRoleToEditor(name, color1, color2) {
        const roleItem = document.createElement('div');
        roleItem.className = 'role-item';
        roleItem.innerHTML = `
            <input type="text" class="role-name" value="${name}">
            <input type="color" class="role-color-1" value="${color1}">
            <input type="color" class="role-color-2" value="${color2}">
            <button class="delete-role"><i class="fas fa-trash"></i></button>
        `;

        roleItem.querySelector('.delete-role').addEventListener('click', () => {
            roleItem.remove();
        });

        rolesContainer.appendChild(roleItem);
    }

    // Save changes
    saveChanges.addEventListener('click', () => {
        const newState = {
            nickname: document.getElementById('nicknameInput').value,
            nicknameColor1: document.getElementById('nicknameColor1').value,
            nicknameColor2: document.getElementById('nicknameColor2').value,
            banner: document.getElementById('bannerInput').value,
            avatar: document.getElementById('avatarInput').value,
            roles: Array.from(rolesContainer.querySelectorAll('.role-item')).map(item => ({
                name: item.querySelector('.role-name').value,
                color1: item.querySelector('.role-color-1').value,
                color2: item.querySelector('.role-color-2').value
            })),
            info: document.getElementById('infoInput').value.split('\n'),
            infoMargin: document.getElementById('infoMarginInput').value,
            snowEnabled: document.getElementById('snowToggle').checked,
            snowEmoji: document.getElementById('snowEmoji').value,
        };

        fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newState)
        })
            .then(() => {
                applyState(newState);
                showToast('Изменения сохранены');
                editorPanel.classList.remove('open');
            })
            .catch(() => {
                showToast('Ошибка при сохранении');
            });
    });

    // Reset changes
    resetChanges.addEventListener('click', () => {
        applyState(originalState);
        localStorage.removeItem('profileState');
        showToast('Изменения сброшены');
        editorPanel.classList.remove('open');
    });

    // Helper functions
    function applyState(state) {
        document.querySelector('.nickname').textContent = state.nickname;
        const gradient = `linear-gradient(45deg, ${state.nicknameColor1}, ${state.nicknameColor2})`;
        document.querySelector('.nickname').style.backgroundImage = gradient;
        document.querySelector('.banner').style.backgroundImage = state.banner ? `url('${state.banner}')` : state.banner;
        document.querySelector('.avatar').style.backgroundImage = state.avatar ? `url('${state.avatar}')` : state.avatar;

        const rolesContainer = document.querySelector('.roles');
        rolesContainer.innerHTML = '';
        state.roles.forEach(role => {
            const roleElement = document.createElement('div');
            roleElement.className = 'role';
            roleElement.textContent = role.name;
            const gradient = `linear-gradient(45deg, ${role.color1}, ${role.color2})`;
            roleElement.style.backgroundImage = gradient;
            rolesContainer.appendChild(roleElement);
        });

        const infoContainer = document.querySelector('.info');
        infoContainer.innerHTML = state.info.map(text => `<p>${text}</p>`).join('');
        infoContainer.style.marginTop = state.infoMargin + 'px';

        if (state.snowEnabled) {
            snowEmoji = state.snowEmoji || '❄️';
            toggleSnow(true);
        } else {
            toggleSnow(false);
        }
    }

    function rgbToHex(rgb) {
        const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (!match) return rgb;
        const [_, r, g, b] = match;
        return '#' + [r, g, b].map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    if (document.getElementById('snowToggle')) {
        document.getElementById('snowToggle').addEventListener('change', (e) => {
            toggleSnow(e.target.checked);
        });

        document.getElementById('snowEmoji').addEventListener('input', (e) => {
            snowEmoji = e.target.value || '❄️';
        });
    }
});