document.addEventListener('DOMContentLoaded', () => {
    // Expose handleSubmission globally so the form can call it
    window.handleSubmission = function (event) {
        event.preventDefault();

        const form = event.target;
        const teamName = form.querySelector('input[placeholder="Team Name"]')?.value || form.querySelectorAll('input')[0].value;
        const repoUrl = form.querySelector('input[placeholder="GitHub Repo URL"]')?.value || form.querySelectorAll('input')[1].value;
        const demoUrl = form.querySelector('input[placeholder="Video Demo URL"]')?.value || form.querySelectorAll('input')[2].value;

        console.log("--- Submission Received ---");
        console.log("Team Name:", teamName);
        console.log("Repo URL:", repoUrl);
        console.log("Demo URL:", demoUrl);

        alert(`Submission Received!\n\nTeam: ${teamName}\nRepo: ${repoUrl}`);

        // perform actual submission to server here or save to local storage
        // localStorage.setItem('submission', JSON.stringify({ teamName, repoUrl, demoUrl }));
    };

    const desktop = document.getElementById('desktop');
    const taskbarApps = document.getElementById('taskbar-apps');
    const clock = document.getElementById('clock');

    let zIndexCounter = 100;
    let windows = []; // Track open windows
    let windowOffset = 0; // Track offset for new windows

    // Update Clock
    function updateClock() {
        clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Dataset unlock check removed (now password based)
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Desktop Icons Interaction
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        // Dragging Logic for Icons
        makeDraggable(icon);

        // Opening Apps
        icon.addEventListener('dblclick', () => {
            const app = icon.dataset.app;
            const title = icon.querySelector('.icon-label').textContent;

            // Single Instance Check
            const existingWin = windows.find(w => w.dataset.app === app);
            if (existingWin) {
                if (existingWin.style.display === 'none') {
                    existingWin.style.display = 'flex';
                }
                moveToFront(existingWin);
                // Also update taskbar active state
                const taskItems = document.querySelectorAll('.taskbar-item');
                // We need to find the correct task item. Since we don't have a direct link here easily without searching, 
                // let's rely on moveToFront or just iterate. 
                // Actually, openWindow creates the link. 
                // Let's just create a helper to find the taskbar item or assume the user just needs it popped up.
                // The taskbar update logic is inside the window interaction, let's trigger it.
                // We can just rely on the click handler of the taskbar item if we had it, but we don't.
                // Simplified: Just bring to front. The window click listener updates the taskbar state? 
                // No, existingWin 'mousedown' does moveToFront. 
                // We should manually trigger the active state update if possible, but let's just show it for now.
                return;
            }

            openWindow(app, title);
        });
    });

    function openWindow(appId, title) {
        // Create Window DOM
        const win = document.createElement('div');
        win.classList.add('os-window');
        win.classList.add('os-window');

        // Smart Positioning (Cascading)
        const baseTop = 50;
        const baseLeft = 100;
        const offsetStep = 30;

        win.style.top = `${baseTop + (windowOffset * offsetStep)}px`;
        win.style.left = `${baseLeft + (windowOffset * offsetStep)}px`;

        // Increment offset, reset if too far
        windowOffset++;
        if (windowOffset > 10) windowOffset = 0;
        if (appId === 'problem') {
            win.style.width = '900px';
            win.style.height = '700px';
        } else {
            win.style.width = '600px';
            win.style.height = '400px';
        }
        win.dataset.app = appId; // Store app ID for single instance check
        win.style.zIndex = ++zIndexCounter;

        // Window Content Structure
        win.innerHTML = `
            <div class="window-titlebar">
                <span class="window-title">${title}</span>
                <div class="window-controls">
                    <div class="control-btn min-btn" title="Minimize"></div>
                    <div class="control-btn max-btn" title="Maximize"></div>
                    <div class="control-btn close-btn" title="Close"></div>
                </div>
            </div>
            <div class="window-content"></div>
            <div class="resizer resizer-t"></div>
            <div class="resizer resizer-r"></div>
            <div class="resizer resizer-b"></div>
            <div class="resizer resizer-l"></div>
            <div class="resizer resizer-tl"></div>
            <div class="resizer resizer-tr"></div>
            <div class="resizer resizer-bl"></div>
            <div class="resizer resizer-br"></div>
        `;

        // Inject Content from Template
        const template = document.getElementById(`app-${appId}`);
        const contentArea = win.querySelector('.window-content');
        if (template) {
            contentArea.appendChild(template.content.cloneNode(true));
        } else {
            contentArea.innerHTML = '<p>App content not found.</p>';
        }

        desktop.appendChild(win);
        windows.push(win);

        // Special Check for Dataset Unlock
        if (appId === 'dataset') {
            const unlockBtn = win.querySelector('#unlock-btn');
            const passwordInput = win.querySelector('#dataset-password');
            const lockScreen = win.querySelector('#dataset-lock-screen');
            const downloadArea = win.querySelector('#dataset-download-area');
            const errorMsg = win.querySelector('#password-error');

            if (unlockBtn) {
                unlockBtn.onclick = () => {
                    if (passwordInput.value === "dsac2026") {
                        lockScreen.style.display = 'none';
                        downloadArea.style.display = 'block';
                    } else {
                        errorMsg.style.display = 'block';
                    }
                };
            }
        }

        // Add Taskbar Item
        const taskItem = document.createElement('div');
        taskItem.classList.add('taskbar-item', 'active');
        taskItem.textContent = title;
        taskItem.onclick = () => {
            if (win.style.display === 'none') {
                win.style.display = 'flex';
                moveToFront(win);
            } else if (win.style.zIndex < zIndexCounter) {
                moveToFront(win);
            } else {
                win.style.display = 'none'; // Minimize
            }
            updateTaskbarState();
        };
        taskbarApps.appendChild(taskItem);

        // Window Interactions
        makeDraggable(win, win.querySelector('.window-titlebar'));

        // Make all resizers work
        win.querySelectorAll('.resizer').forEach(resizer => {
            makeResizable(win, resizer);
        });

        win.addEventListener('mousedown', () => moveToFront(win));

        // Controls
        win.querySelector('.close-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            closeWindow(win, taskItem);
        });

        win.querySelector('.min-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            win.style.display = 'none';
            updateTaskbarState();
        });

        win.querySelector('.max-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMaximize(win);
        });

        function updateTaskbarState() {
            document.querySelectorAll('.taskbar-item').forEach(i => i.classList.remove('active'));
            if (win.style.display !== 'none' && win.style.zIndex == zIndexCounter) {
                taskItem.classList.add('active');
            }
        }
    }

    function closeWindow(win, taskItem) {
        win.remove();
        taskItem.remove();
        windows = windows.filter(w => w !== win);
    }

    function moveToFront(win) {
        win.style.zIndex = ++zIndexCounter;
    }

    function toggleMaximize(win) {
        if (win.classList.contains('maximized')) {
            win.classList.remove('maximized');
            win.style.width = win.dataset.prevWidth;
            win.style.height = win.dataset.prevHeight;
            win.style.top = win.dataset.prevTop;
            win.style.left = win.dataset.prevLeft;
        } else {
            win.dataset.prevWidth = win.style.width;
            win.dataset.prevHeight = win.style.height;
            win.dataset.prevTop = win.style.top;
            win.dataset.prevLeft = win.style.left;

            win.classList.add('maximized');
            win.style.width = '100%';
            win.style.height = '100%';
            win.style.top = '0';
            win.style.left = '0';
        }
    }

    // Drag Logic
    function makeDraggable(element, handle = element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        handle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
            moveToFront(element);
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // Resizing Logic
    function makeResizable(element, resizer) {
        resizer.addEventListener('mousedown', initResize, false);

        function initResize(e) {
            e.preventDefault(); // Prevent text selection
            window.addEventListener('mousemove', resize, false);
            window.addEventListener('mouseup', stopResize, false);
        }

        function resize(e) {
            const rect = element.getBoundingClientRect();
            const classList = resizer.classList;

            if (classList.contains('resizer-r') || classList.contains('resizer-br') || classList.contains('resizer-tr')) {
                element.style.width = (e.clientX - rect.left) + 'px';
            }
            if (classList.contains('resizer-b') || classList.contains('resizer-br') || classList.contains('resizer-bl')) {
                element.style.height = (e.clientY - rect.top) + 'px';
            }
            if (classList.contains('resizer-l') || classList.contains('resizer-bl') || classList.contains('resizer-tl')) {
                // For left resizing, we change/reduce width and move left position
                const currentRight = rect.right;
                const newWidth = currentRight - e.clientX;
                if (newWidth > 300) { // Min width
                    element.style.width = newWidth + 'px';
                    element.style.left = e.clientX + 'px';
                }
            }
            if (classList.contains('resizer-t') || classList.contains('resizer-tl') || classList.contains('resizer-tr')) {
                // For top resizing, we change/reduce height and move top position
                const currentBottom = rect.bottom;
                const newHeight = currentBottom - e.clientY;
                if (newHeight > 200) { // Min height
                    element.style.height = newHeight + 'px';
                    element.style.top = e.clientY + 'px';
                }
            }
        }

        function stopResize(e) {
            window.removeEventListener('mousemove', resize, false);
            window.removeEventListener('mouseup', stopResize, false);
        }
    }


});
