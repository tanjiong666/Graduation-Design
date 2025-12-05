// 全局变量定义
let currentSection = 1;
const totalSections = 5;
const scrollDuration = 600; // 板块滚动时长

// 轮播核心配置（板块1）
let carouselCurrentSlide = 0;
let carouselSlides = null;
let slideWidth = 0;
const carouselAutoPlayTime = 2500; // 自动切换间隔
let carouselTimer = null; // 自动播放定时器

// 标记板块4动画是否已播放
let section4Animated = false;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 等待DOM完全加载，增加短延迟确保元素渲染
    setTimeout(() => {
        // 获取DOM元素
        const startPage = document.getElementById('start-page');
        const mainContent = document.getElementById('main-content');
        const enterBtn = document.getElementById('enter-btn');
        const contentWrapper = document.getElementById('content-wrapper');
        const navItems = document.querySelectorAll('.nav-item');
        const section4 = document.querySelector('[data-section-id="4"]');
        
        // 调试：检查元素是否获取成功
        console.log('元素检查：', {
            startPage: !!startPage,
            mainContent: !!mainContent,
            enterBtn: !!enterBtn,
            contentWrapper: !!contentWrapper
        });

        // 修复1：确保按钮可点击（解决指针事件覆盖问题）
        if (enterBtn) {
            // 强制设置按钮层级和指针事件
            enterBtn.style.position = 'relative';
            enterBtn.style.zIndex = '100';
            enterBtn.style.pointerEvents = 'auto';
            
            // 启动页进入按钮事件（修复核心）
            enterBtn.addEventListener('click', function(e) {
                e.stopPropagation(); // 阻止事件冒泡
                console.log('按钮被点击了！'); // 调试日志
                
                // 隐藏启动页
                startPage.style.opacity = '0';
                startPage.style.pointerEvents = 'none';
                
                // 显示主内容
                document.body.classList.add('show-bg');
                mainContent.style.opacity = '1';
                mainContent.style.pointerEvents = 'auto';
                
                // 启动页消失后初始化轮播
                setTimeout(() => {
                    startPage.style.display = 'none';
                    
                    // 初始化各功能
                    initCarousel(); // 板块1轮播
                    startCarouselAutoPlay(); // 启动自动播放
                    initMapCategory(); // 初始化板块二分类切换
                }, 500);
            });
            
            // 额外：添加键盘回车/空格触发按钮
            enterBtn.tabIndex = 0;
            enterBtn.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    enterBtn.click();
                }
            });
        }

        // 导航栏点击事件（平滑滚动）
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                const targetSection = parseInt(this.dataset.section);
                currentSection = targetSection;
                updateNavActive(targetSection);
                smoothScrollTo((targetSection - 1) * window.innerHeight);
                
                // 点击到板块4时触发动画
                if (targetSection === 4 && section4) {
                    triggerSection4Animation();
                } else {
                    // 离开板块4时重置动画状态
                    section4Animated = false;
                    resetSection4Style();
                }
            });
        });

        // 滚轮滚动事件（平滑滚动）
        if (contentWrapper) {
            contentWrapper.addEventListener('wheel', function(e) {
                e.preventDefault();
                // 判断滚动方向
                if (e.deltaY > 0) {
                    currentSection = Math.min(currentSection + 1, totalSections);
                } else {
                    currentSection = Math.max(currentSection - 1, 1);
                }
                updateNavActive(currentSection);
                smoothScrollTo((currentSection - 1) * window.innerHeight);
                
                // 滚动到板块4时触发动画
                if (currentSection === 4 && section4) {
                    triggerSection4Animation();
                } else {
                    // 离开板块4时重置动画状态
                    section4Animated = false;
                    resetSection4Style();
                }
            }, { passive: false });

            // 触摸滑动事件（移动端适配+平滑滚动）
            let touchStartY = 0;
            contentWrapper.addEventListener('touchstart', function(e) {
                touchStartY = e.touches[0].clientY;
            }, { passive: true });

            contentWrapper.addEventListener('touchend', function(e) {
                const touchEndY = e.changedTouches[0].clientY;
                const touchDiff = touchEndY - touchStartY;
                
                if (touchDiff < -50) {
                    currentSection = Math.min(currentSection + 1, totalSections);
                } else if (touchDiff > 50) {
                    currentSection = Math.max(currentSection - 1, 1);
                }
                updateNavActive(currentSection);
                smoothScrollTo((currentSection - 1) * window.innerHeight);
                
                // 滑动到板块4时触发动画
                if (currentSection === 4 && section4) {
                    triggerSection4Animation();
                } else {
                    section4Animated = false;
                    resetSection4Style();
                }
            }, { passive: true });
        }

        // 响应式调整
        window.addEventListener('resize', function() {
            updateNavActive(currentSection);
            smoothScrollTo((currentSection - 1) * window.innerHeight, 300);
            // 重置板块1轮播宽度
            if (carouselSlides) {
                slideWidth = document.querySelector('.carousel-slide')?.offsetWidth || 0;
                updateCarousel();
            }
        });

    }, 100); // 增加短延迟确保元素渲染完成
});

// 更新导航激活状态
function updateNavActive(sectionNum) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('nav-item-active');
        if (parseInt(item.dataset.section) === sectionNum) {
            item.classList.add('nav-item-active');
        }
    });
}

// 平滑滚动核心函数（带缓动效果）
function smoothScrollTo(targetY, duration = scrollDuration) {
    const contentWrapper = document.getElementById('content-wrapper');
    if (!contentWrapper) return;
    
    const startY = contentWrapper.scrollTop;
    const distance = targetY - startY;
    const startTime = performance.now();

    function scrollStep(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        const easeProgress = easeInOutCubic(progress);
        contentWrapper.scrollTop = startY + distance * easeProgress;

        if (progress < 1) {
            requestAnimationFrame(scrollStep);
        }
    }
    requestAnimationFrame(scrollStep);
}

// 缓动函数
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// 初始化板块1轮播
function initCarousel() {
    carouselSlides = document.querySelector('.carousel-slides');
    if (!carouselSlides) return;
    
    slideWidth = document.querySelector('.carousel-slide')?.offsetWidth || 0;
    carouselCurrentSlide = 0;
    updateCarousel();

    // 鼠标悬停轮播区域时暂停自动播放，离开后恢复
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', pauseCarouselAutoPlay);
        carouselContainer.addEventListener('mouseleave', startCarouselAutoPlay);
    }
}

// 更新板块1轮播位置
function updateCarousel() {
    if (carouselSlides) {
        carouselSlides.style.transform = `translateX(-${carouselCurrentSlide * slideWidth}px)`;
    }
}

// 板块1轮播下一页（支持循环）
function carouselNextSlide() {
    const slideCount = document.querySelectorAll('.carousel-slide').length || 0;
    carouselCurrentSlide = (carouselCurrentSlide + 1) % slideCount; // 取模实现循环
    updateCarousel();
}

// 板块1轮播上一页（支持循环）
function carouselPrevSlide() {
    const slideCount = document.querySelectorAll('.carousel-slide').length || 0;
    carouselCurrentSlide = (carouselCurrentSlide - 1 + slideCount) % slideCount; // 避免负数
    updateCarousel();
}

// 启动板块1轮播自动播放
function startCarouselAutoPlay() {
    // 先清除已有定时器，避免重复
    if (carouselTimer) clearInterval(carouselTimer);
    carouselTimer = setInterval(carouselNextSlide, carouselAutoPlayTime);
}

// 暂停板块1轮播自动播放
function pauseCarouselAutoPlay() {
    if (carouselTimer) clearInterval(carouselTimer);
}

// 重置板块4样式（隐藏文字）
function resetSection4Style() {
    const section4 = document.querySelector('[data-section-id="4"]');
    if (!section4) return;
    
    const section4Title = section4.querySelector('h2');
    const section4Texts = section4.querySelectorAll('.content-text');
    
    if (section4Title) {
        section4Title.style.opacity = '0';
        section4Title.style.transform = 'translateY(20px)';
        section4Title.style.animation = 'none';
    }
    
    if (section4Texts) {
        section4Texts.forEach(text => {
            text.style.opacity = '0';
            text.style.transform = 'translateY(30px)';
            text.style.animation = 'none';
        });
    }
}

// 触发板块4动画
function triggerSection4Animation() {
    const section4 = document.querySelector('[data-section-id="4"]');
    if (!section4 || section4Animated) return;
    
    const section4Title = section4.querySelector('h2');
    const section4Texts = section4.querySelectorAll('.content-text');
    
    // 标题动画（先出现）
    if (section4Title) {
        section4Title.style.animation = 'lineUp 0.8s ease-out forwards';
        section4Title.style.animationDelay = '0s';
    }
    
    // 逐行文字动画
    if (section4Texts) {
        section4Texts.forEach((text, index) => {
            text.style.animation = 'lineUp 0.8s ease-out forwards';
            text.style.animationDelay = `${0.2 + index * 0.3}s`;
        });
    }
    
    // 标记已播放
    section4Animated = true;
}

// 初始化板块二分类切换（简化版）
function initMapCategory() {
    const tabBtns = document.querySelectorAll('.map-tab-btn');
    const allCards = document.querySelectorAll('.map-card');

    // 分类按钮切换逻辑
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除所有按钮active
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // 获取当前分类
            const currentCategory = this.dataset.category;
            
            // 隐藏所有卡片，显示当前分类卡片
            allCards.forEach(card => {
                card.classList.remove('active-category');
                if (card.dataset.category === currentCategory) {
                    card.classList.add('active-category');
                }
            });
        });
    });
}

// 暴露轮播控制方法到全局
window.carouselPrev = carouselPrevSlide;
window.carouselNext = carouselNextSlide;