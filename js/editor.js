document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const editButton = document.getElementById('editButton');
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
        nicknameColor: getComputedStyle(document.querySelector('.nickname')).color,
        banner: document.querySelector('.banner').style.backgroundImage,
        avatar: document.querySelector('.avatar').style.backgroundImage,
        roles: Array.from(document.querySelectorAll('.role')).map(role => ({
            name: role.textContent,
            color: getComputedStyle(role).backgroundColor
        })),
        info: Array.from(document.querySelector('.info').children).map(p => p.innerHTML)
    };

    // Load saved state from localStorage if exists
    const savedState = localStorage.getItem('profileState');
    if (savedState) {
        const state = JSON.parse(savedState);
        applyState(state);
    }

    // Event Listeners
    editButton.addEventListener('click', () => {
        editorPanel.classList.add('open');
        populateEditor();
    });

    closeEditor.addEventListener('click', () => {
        editorPanel.classList.remove('open');
    });

    // Populate editor with current values
    function populateEditor() {
        document.getElementById('nicknameInput').value = document.querySelector('.nickname').textContent;
        document.getElementById('nicknameColor').value = rgbToHex(getComputedStyle(document.querySelector('.nickname')).color);
        document.getElementById('bannerInput').value = document.querySelector('.banner').style.backgroundImage.replace(/url\(['"](.+)['"]\)/, '$1');
        document.getElementById('avatarInput').value = document.querySelector('.avatar').style.backgroundImage.replace(/url\(['"](.+)['"]\)/, '$1');
        
        // Populate roles
        rolesContainer.innerHTML = '';
        document.querySelectorAll('.role').forEach(role => {
            addRoleToEditor(role.textContent, rgbToHex(getComputedStyle(role).backgroundColor));
        });

        // Populate info
        document.getElementById('infoInput').value = Array.from(document.querySelector('.info').children)
            .map(p => p.innerHTML).join('\n');
    }

    // Add new role
    addRoleBtn.addEventListener('click', () => {
        addRoleToEditor('Новая роль', '#FF4500');
    });

    function addRoleToEditor(name, color) {
        const roleItem = document.createElement('div');
        roleItem.className = 'role-item';
        roleItem.innerHTML = `
            <input type="text" class="role-name" value="${name}">
            <input type="color" class="role-color" value="${color}">
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
            nicknameColor: document.getElementById('nicknameColor').value,
            banner: document.getElementById('bannerInput').value,
            avatar: document.getElementById('avatarInput').value,
            roles: Array.from(rolesContainer.querySelectorAll('.role-item')).map(item => ({
                name: item.querySelector('.role-name').value,
                color: item.querySelector('.role-color').value
            })),
            info: document.getElementById('infoInput').value.split('\n')
        };

        applyState(newState);
        localStorage.setItem('profileState', JSON.stringify(newState));
        showToast('Изменения сохранены');
        editorPanel.classList.remove('open');
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
        document.querySelector('.nickname').style.color = state.nicknameColor;
        document.querySelector('.banner').style.backgroundImage = `url('${state.banner}')`;
        document.querySelector('.avatar').style.backgroundImage = `url('${state.avatar}')`;

        const rolesContainer = document.querySelector('.roles');
        rolesContainer.innerHTML = '';
        state.roles.forEach(role => {
            const roleElement = document.createElement('div');
            roleElement.className = 'role';
            roleElement.textContent = role.name;
            roleElement.style.backgroundColor = role.color;
            rolesContainer.appendChild(roleElement);
        });

        const infoContainer = document.querySelector('.info');
        infoContainer.innerHTML = state.info.map(text => `<p>${text}</p>`).join('');
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
});
