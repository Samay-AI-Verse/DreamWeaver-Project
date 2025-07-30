document.addEventListener('DOMContentLoaded', () => {
    // Hide loading overlay with animation
    window.addEventListener('load', () => {
        const loadingOverlay = document.querySelector('.loading-overlay');
        gsap.to(loadingOverlay, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => loadingOverlay.style.display = 'none'
        });
    });

    // Ensure navbar transparency on load and prevent changes
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.style.background = 'rgba(255, 255, 255, 0.05)';
        navbar.style.backdropFilter = 'blur(5px)';
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
        navbar.style.transition = 'none';
    }

    // Login Form Animation
    const loginButton = document.getElementById('loginButton');
    const loginFormContainer = document.getElementById('loginForm');
    const closeFormButton = document.getElementById('closeForm');

    if (loginButton && loginFormContainer) {
        loginButton.addEventListener('click', (e) => {
            e.preventDefault();
            loginFormContainer.style.display = 'flex';
            gsap.fromTo(loginFormContainer, 
                { opacity: 0, y: -50 },
                { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
            );
            gsap.fromTo('.login-form', 
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out', delay: 0.2 }
            );
        });
    }

    if (closeFormButton && loginFormContainer) {
        closeFormButton.addEventListener('click', () => {
            gsap.to('.login-form', 
                { scale: 0.8, opacity: 0, duration: 0.3, ease: 'power2.in' }
            );
            gsap.to(loginFormContainer, 
                { opacity: 0, y: -50, duration: 0.3, ease: 'power2.in', 
                  onComplete: () => loginFormContainer.style.display = 'none' }
            );
        });
    }

    // Smooth Scrolling for Nav Links with Page Transition
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        if (!anchor.id || anchor.id !== 'loginButton') { // Exclude login button
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    const transitionOverlay = document.querySelector('.page-transition');
                    gsap.to(transitionOverlay, {
                        transform: 'translateX(0)',
                        duration: 0.5,
                        ease: 'power2.in',
                        onComplete: () => {
                            window.scrollTo({
                                top: targetElement.offsetTop - 70,
                                behavior: 'smooth'
                            });
                            gsap.to(transitionOverlay, {
                                transform: 'translateX(100%)',
                                duration: 0.5,
                                ease: 'power2.out',
                                onComplete: () => {
                                    transitionOverlay.style.transform = 'translateX(-100%)';
                                    // Re-ensure navbar transparency
                                    if (navbar) {
                                        navbar.style.background = 'rgba(255, 255, 255, 0.05)';
                                        navbar.style.backdropFilter = 'blur(5px)';
                                        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
                                        navbar.style.transition = 'none';
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
    });

    // GSAP Animations for Hero Section
    const heroTimeline = gsap.timeline();
    heroTimeline
        .from('.hero-content h1', { 
            opacity: 0, 
            y: -50, 
            duration: 1, 
            ease: 'power3.out' 
        })
        .from('.hero-content p', { 
            opacity: 0, 
            y: 30, 
            duration: 0.8, 
            ease: 'power2.out' 
        }, '-=0.5')
        .from('.hero-content a', { 
            opacity: 0, 
            y: 30, 
            duration: 0.8, 
            stagger: 0.2,
            ease: 'back.out' 
        }, '-=0.3');

    // Enhanced Three.js 3D Background
    const initThreeJS = () => {
        const canvas = document.getElementById('threeCanvas');
        if (!canvas) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            alpha: true,
            antialias: true 
        });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);

        // Enhanced Torus Knot (Brain-like shape, increased size)
        const torusGeometry = new THREE.TorusKnotGeometry(7, 2, 300, 20);
        const torusMaterial = new THREE.MeshPhongMaterial({
            color: 0x4caf50,
            emissive: 0x222222,
            specular: 0xffffff,
            shininess: 50,
            wireframe: true,
            transparent: true,
            opacity: 0.4
        });
        const torusMesh = new THREE.Mesh(torusGeometry, torusMaterial);
        scene.add(torusMesh);

        // Particle System (Floating Dots)
        const particleCount = 500;
        const particlesGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 30;
            positions[i + 1] = (Math.random() - 0.5) * 30;
            positions[i + 2] = (Math.random() - 0.5) * 30;
            
            // Random colors between green and gold
            colors[i] = Math.random() > 0.5 ? 0.3 + Math.random() * 0.2 : 0.8 + Math.random() * 0.2;
            colors[i + 1] = Math.random() > 0.5 ? 0.6 + Math.random() * 0.3 : 0.5 + Math.random() * 0.2;
            colors[i + 2] = 0.1 + Math.random() * 0.2;
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });
        
        const particles = new THREE.Points(particlesGeometry, particleMaterial);
        scene.add(particles);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);
        
        const pointLight = new THREE.PointLight(0xffab00, 0.5, 50);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        camera.position.z = 15;

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            
            torusMesh.rotation.x += 0.002;
            torusMesh.rotation.y += 0.003;
            torusMesh.rotation.z += 0.001;
            
            particles.rotation.y += 0.0005;
            
            // Make particles float up and down slightly
            const time = Date.now() * 0.0005;
            const positions = particles.geometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3 + 1] += Math.sin(time + i) * 0.01;
            }
            
            particles.geometry.attributes.position.needsUpdate = true;
            
            renderer.render(scene, camera);
        };

        animate();

        // Handle window resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            // Re-ensure navbar transparency on resize
            if (navbar) {
                navbar.style.background = 'rgba(255, 255, 255, 0.05)';
                navbar.style.backdropFilter = 'blur(5px)';
                navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
                navbar.style.transition = 'none';
            }
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    };

    // Initialize Three.js
    initThreeJS();

    // Initialize AOS
    AOS.init({
        duration: 800,
        once: true,
        easing: 'ease-out-quad'
    });

    // Page load animation
    gsap.from('body', {
        opacity: 0,
        duration: 1,
        ease: 'power2.out'
    });
    
    // Enhanced feature card hover animations
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            gsap.to(card.querySelector('.feature-icon'), {
                y: -5,
                duration: 0.3,
                ease: 'power2.out'
            });
            
            gsap.to(card, {
                y: -10,
                duration: 0.4,
                ease: 'power2.out'
            });
        });
        
        card.addEventListener('mouseleave', () => {
            gsap.to(card.querySelector('.feature-icon'), {
                y: 0,
                duration: 0.3,
                ease: 'power2.out'
            });
            
            gsap.to(card, {
                y: 0,
                duration: 0.4,
                ease: 'power2.out'
            });
        });
    });
    
    // Floating animation for geometric shapes
    gsap.to('.geometric-shape', {
        y: 10,
        duration: 8,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
    });
});