document.addEventListener("DOMContentLoaded", function () {
    function startRunningText() {
        document.querySelectorAll('.running-text').forEach(function (container) {
            let text = container.textContent.trim(); // Get the product description text
            container.textContent = ''; // Clear the container text

            // Split text into parts and create paragraphs
            let parts = text.split('.').filter(Boolean); // Split by period
            let paragraphs = parts.map(part => {
                let p = document.createElement('p');
                p.textContent = part + '.'; // Add back the period
                p.classList.add('inactive'); // Start as inactive
                container.appendChild(p);
                return p;
            });

            let currentIndex = 0;
            let intervalId;

            function showCurrentParagraph() {
                paragraphs.forEach((p, index) => {
                    // Show all paragraphs up to the current index and the next ones
                    if (index <= currentIndex) {
                        p.style.display = 'block'; // Show current and previous paragraphs
                        p.classList.add('inactive');
                        if (index === currentIndex) {
                            p.classList.remove('inactive');
                            p.classList.add('active');
                        }
                    } else {
                        // Show all future paragraphs as inactive
                        p.style.display = 'block';
                        p.classList.add('inactive');
                        p.classList.remove('active');
                    }
                });

                // Scroll to ensure the current paragraph is visible
                let maxScrollTop = container.scrollHeight - container.offsetHeight;
                let targetScrollTop = paragraphs[currentIndex].offsetTop;
                container.scrollTo({
                    top: Math.min(targetScrollTop, maxScrollTop),
                    behavior: 'smooth',
                });
            }

            // Initially display the first paragraph
            setTimeout(() => {
                currentIndex = 0;
                showCurrentParagraph();

                // Start automatic paragraph change
                intervalId = setInterval(() => {
                    if (currentIndex < paragraphs.length - 1) {
                        currentIndex++;
                        showCurrentParagraph();
                    } else {
                        clearInterval(intervalId); // Stop at the last paragraph
                    }
                }, 3000);
            }, 1000);

            // Handle click on the container to advance paragraphs
            container.addEventListener('click', () => {
                clearInterval(intervalId); // Stop automatic transition
                if (currentIndex < paragraphs.length - 1) {
                    currentIndex++;
                } else {
                    currentIndex = 0; // Loop back to the first paragraph
                    container.scrollTo({ top: 0, behavior: 'smooth' }); // Reset scroll
                }
                showCurrentParagraph();
            });
        });
    }
    startRunningText();
});
