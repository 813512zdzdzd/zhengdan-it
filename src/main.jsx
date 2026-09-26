import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowUpRight, Check, ChevronRight, Code2, ExternalLink, Mail, Pencil, Play, Sparkles, Upload, Trash2, X, Zap } from 'lucide-react'
import './styles.css'

function CursorTrail() {
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return undefined
    const canvas = document.createElement('canvas')
    canvas.className = 'cursor-trail-canvas'
    document.body.appendChild(canvas)
    const ctx = canvas.getContext('2d')
    const points = []
    let frame
    let dpr = window.devicePixelRatio || 1
    const resize = () => {
      dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const move = event => {
      points.push({ x: event.clientX, y: event.clientY, life: 1 })
      if (points.length > 34) points.shift()
    }
    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      points.forEach(point => { point.life -= 0.028 })
      while (points[0]?.life <= 0) points.shift()
      if (points.length > 1) {
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y))
        ctx.strokeStyle = `rgba(197, 128, 255, ${Math.max(points[0].life, 0) * 0.72})`
        ctx.lineWidth = 2.2
        ctx.shadowBlur = 14
        ctx.shadowColor = '#b76cff'
        ctx.stroke()
        ctx.shadowBlur = 0
      }
      frame = requestAnimationFrame(draw)
    }
    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', move, { passive: true })
    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', move)
      canvas.remove()
    }
  }, [])
  return null
}
const defaultWorks = [
  ['01', '霓虹抵达', '品牌广告', '/media/hero.mp4'], ['02', '剪辑练习', '剪辑实验', '/media/editing.mp4'],
  ['03', '跆拳道少女做面包', '内容短片', '/media/baking.mp4'], ['04', '留学这一程', '教育内容', '/media/study.mp4'],
  ['05', '翡翠湖日记', '旅行 Vlog', '/media/emerald.mp4'], ['06', '天选养狗人', 'AIGC 短片', '/media/chosen-dog-owner.mp4'],
  ['07', '城市在流动', '企业宣传', '/media/corporate.mp4'],
  ['08', '猫咪小屋搭建', '延时摄影', '/media/cat-house-timelapse.mp4'],
  ['09', '西安全息建筑生长', '特效实验', '/media/xian-hologram-growth.mp4'],
]
const services = [
  ['01', '内容创作', '从一个选题到完整成片，把好想法变成有传播力的内容。', Sparkles],
  ['02', '新媒体运营', '围绕平台、用户和目标，建立清晰的内容节奏与运营策略。', Code2],
  ['03', 'IP 编导', '提炼人物记忆点，用脚本和镜头建立一个有温度的个人 IP。', Zap],
  ['04', '后期制作', '剪辑、声音、节奏与包装，让每个镜头都服务于故事。', Check],
]

const readSettings = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('zd-site-settings') || '{}')
    if (!saved.role || saved.role === 'AIGC DIRECTOR / EDUCATOR') saved.role = '新媒体运营 / IP编导'
    return saved
  } catch { return { role: '新媒体运营 / IP编导' } }
}
const readWorks = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('zd-site-works') || 'null')
    if (!Array.isArray(saved)) return defaultWorks
    const removedTitles = new Set(['补水瞬间', '共享一程', '突然变大', '甲乙丙丁'])
    const kept = saved.filter(item => !removedTitles.has(item[1]))
    const ordered = [...kept.filter(item => item[1] !== '城市在流动'), ...kept.filter(item => item[1] === '城市在流动')]
    const additions = defaultWorks.filter(item => ['猫咪小屋搭建', '西安全息建筑生长'].includes(item[1]) && !ordered.some(savedItem => savedItem[1] === item[1]))
    return [...ordered, ...additions].map((item, i) => {
      const fallback = defaultWorks[i] || [`${String(i + 1).padStart(2, '0')}`, '新作品', '视频作品', '/media/hero.mp4']
      return [`${String(i + 1).padStart(2, '0')}`, item[1] || fallback[1], item[2] || fallback[2], item[3] || fallback[3]]
    })
  } catch { return defaultWorks }
}
const fileData = file => new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(file) })

function VideoCard({ item, onOpen }) {
  const [num, title, tag, src] = item
  return <article className="video-card" onClick={() => onOpen(item)}>
    <div className="video-frame"><video src={src} preload="auto" playsInline aria-label={`${title} 首帧预览`} /><span className="video-number">{num}</span><button className="video-play" aria-label={`播放 ${title}`}><Play size={17} fill="currentColor" /></button></div>
    <div className="video-caption"><div><span>{tag}</span><h3>{title}</h3></div><ExternalLink size={17} /></div>
  </article>
}

function Editor({ open, onClose, settings, setSettings, works, setWorks }) {
  const [draft, setDraft] = useState(settings)
  useEffect(() => setDraft(settings), [settings])
  const change = (key, value) => setDraft(prev => ({ ...prev, [key]: value }))
  const save = () => { try { setSettings(draft); localStorage.setItem('zd-site-settings', JSON.stringify(draft)); localStorage.setItem('zd-site-works', JSON.stringify(works.map(work => work.slice(0, 4)))) } catch { window.alert('上传的视频较大，浏览器无法长期保存；当前页面仍可继续预览。') } onClose() }
  const uploadSetting = async (key, file) => { if (file) change(key, await fileData(file)) }
  const replaceVideo = async (index, file) => { if (file) { const src = await fileData(file); setWorks(prev => prev.map((w, i) => i === index ? [...w.slice(0, 3), src] : w)) } }
  const updateWork = (index, pos, value) => setWorks(prev => prev.map((w, i) => i === index ? w.map((v, j) => j === pos ? value : v) : w))
  const addWork = () => setWorks(prev => [...prev, [`${String(prev.length + 1).padStart(2, '0')}`, '新作品', '视频作品', '/media/hero.mp4']])
  const removeWork = index => setWorks(prev => prev.filter((_, i) => i !== index).map((work, i) => [`${String(i + 1).padStart(2, '0')}`, ...work.slice(1)]))
  if (!open) return null
  return <div className="editor-shade"><aside className="editor-panel"><div className="editor-head"><div><span className="editor-kicker">网站修改器</span><h2>修改网站</h2></div><button onClick={onClose} aria-label="关闭编辑器"><X /></button></div><p className="editor-hint">修改后点击保存，文字、图片和视频会保存在当前浏览器；上传大视频时建议控制文件大小。</p><div className="editor-scroll"><section className="editor-section"><h3>首页文字</h3><label>身份标题<input value={draft.role || ''} onChange={e => change('role', e.target.value)} /></label><label>主标题<input value={draft.title || ''} onChange={e => change('title', e.target.value)} /></label><label>简介<textarea rows="3" value={draft.intro || ''} onChange={e => change('intro', e.target.value)} /></label></section><section className="editor-section"><h3>图片与视频</h3><label className="file-label">更换首页图片<input type="file" accept="image/*" onChange={e => uploadSetting('portrait', e.target.files[0])} /><span><Upload size={14} />选择图片</span></label><label className="file-label">更换首页背景视频<input type="file" accept="video/*" onChange={e => uploadSetting('heroVideo', e.target.files[0])} /><span><Upload size={14} />选择视频</span></label></section><section className="editor-section"><div className="editor-row"><h3>作品模块</h3><button className="add-work" onClick={addWork}><span>＋</span> 增加视频模块</button></div>{works.map((work, i) => <div className="work-edit" key={`${work[0]}-${i}`}><strong>{work[0]}</strong><input value={work[1]} onChange={e => updateWork(i, 1, e.target.value)} aria-label="作品标题" /><input value={work[2]} onChange={e => updateWork(i, 2, e.target.value)} aria-label="作品分类" /><div className="work-actions"><label className="mini-file"><Upload size={13} />上传视频<input type="file" accept="video/*" onChange={e => replaceVideo(i, e.target.files[0])} /></label><button className="delete-work" type="button" onClick={() => removeWork(i)}><Trash2 size={13} />删除</button></div></div>)}</section></div><div className="editor-actions"><button className="reset-editor" onClick={() => { localStorage.removeItem('zd-site-settings'); localStorage.removeItem('zd-site-works'); setSettings({}); setDraft({}); setWorks(defaultWorks) }}>恢复默认</button><button className="save-editor" onClick={save}>保存修改</button></div></aside></div>
}

function App() {
  const saved = useMemo(readSettings, [])
  const [settings, setSettings] = useState(saved)
  const [works, setWorks] = useState(readWorks)
  const [active, setActive] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)
  useEffect(() => { document.body.style.overflow = active || editorOpen ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [active, editorOpen])
  const text = { role: settings.role || '新媒体运营 / IP编导', title: settings.title || '郑丹\n新媒体运营', intro: settings.intro || '用内容连接人群\n用脚本放大影响力\n用镜头记录真实' }
  return <main><CursorTrail />
    <section className="hero-ref" id="top"><video className="hero-bg-video" src={settings.heroVideo || '/media/hero-background.mp4'} autoPlay muted loop playsInline /><div className="hero-orb" /><nav className="topbar page"><div className="toplinks"><a href="#about">关于我</a><a href="#work">作品</a><a href="#contact">联系</a></div><div className="top-actions"><a className="availability" href="mailto:3522304412@qq.com"><i /> 接受合作邀约</a>{import.meta.env.DEV && <button className="edit-trigger" onClick={() => setEditorOpen(true)}><Pencil size={13} /> 修改网站</button>}</div></nav><div className="hero-layout page"><div className="hero-copy"><p className="mini">{text.role}</p><h1>{text.title.split('\n').map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}<span className={i === 1 ? 'accent' : ''}>{line}</span></React.Fragment>)}</h1><p className="script">IP编导</p><p className="hero-intro">{text.intro.split('\n').map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>)}</p></div><div className="hero-portrait"><img src={settings.portrait || '/media/profile.png'} alt="新媒体运营与IP编导职业头像" /><div className="orbit one" /><div className="orbit two" /></div></div><div className="hero-stats page"><div><strong>3<span>+</span></strong><small>年内容经验</small></div><div><strong>200<span>+</span></strong><small>内容项目</small></div><div><strong>25<span>+</span></strong><small>合作客户</small></div><div><strong>10<span>+</span></strong><small>创作技能</small></div></div></section>
    <section className="services page" id="about"><div className="section-title"><h2>我能<br /><em>做什么</em></h2><p>我策划、运营并编导<br />有温度、有传播力的<br />内容与人物故事。</p><a className="resume-link" href="/resume-zhengdan.pdf" target="_blank" rel="noreferrer">查看我的简历 <ArrowUpRight size={15} /></a></div><div className="service-grid">{services.map(([num, title, desc, Icon]) => <article className="service-card" key={num}><Icon size={26} /><span className="service-num">{num}</span><h3>{title}</h3><p>{desc}</p></article>)}</div><div className="experience-panel"><div className="experience-heading"><h3>工作经历</h3><span>WORK EXPERIENCE</span></div><article className="experience-item"><div className="experience-meta"><strong>2024.7～2026.9</strong><span>IP 编导</span></div><div><h4>成都星豚传媒科技有限公司</h4><ul><li><b>内容策划：</b>负责“疯控姐妹”账号策划与文案撰写，确立“上门喂养美 vlog”主线，搭建上门实录、养宠干货、职业日常、服务与招募四大选题方向。</li><li><b>内容生产与发布：</b>沉淀可复用 vlog 结构模板与选题库，月更 10 条左右，26 个月累计产出 248 条作品；运营期间累计涨粉约 31 万。</li><li><b>客资与转化：</b>搭建“短视频引流 → 私域承接”链路，覆盖橱窗带货、品牌商单、服务下单、宠托师招募与课程付费等转化路径；月度服务咨询约 1200 条，有效客资约 400 条。</li><li><b>数据复盘与商业变现：</b>定期复盘播放、互动、涨粉与转化数据，打造 21 条百万级播放视频，最高单条约 800 万播放，月度综合变现约 60 万元。</li></ul></div></article><article className="experience-item"><div className="experience-meta"><strong>2023.12～2024.6</strong><span>新媒体运营</span></div><div><h4>成都和猫住网络科技有限公司</h4><ul><li><b>工作内容：</b>负责“和猫住”账号的内容剪辑、发布与后台求助承接，协助完成选题整理与叙事结构优化。</li><li><b>拍摄剪辑与发布：</b>完成救援纪实、流浪动物领养内容剪辑与发布，半年累计产出约 50 条视频。</li><li><b>公益转化结果：</b>协助领养活动内容预热、评论区引导与后台求助承接，半年累计成功送养约 120 只。</li></ul></div></article></div></section>
    <section className="works page" id="work"><div className="section-bar"><h2>精选 <em>作品</em></h2><a href="#contact">查看全部作品 <ChevronRight size={15} /></a></div><div className="works-grid">{works.map(item => <VideoCard key={`${item[0]}-${item[1]}`} item={item} onOpen={setActive} />)}</div></section>
    <section className="lower page"><div className="toolkit"><div className="section-bar"><h2>我的 <em>工具</em></h2></div><div className="tool-grid">{['Midjourney', 'Runway', '可灵 AI', '剪映', 'ChatGPT', 'libtv', 'WorkBuddy', '达芬奇', 'PS', 'Premiere', 'Figma', 'After Effects'].map(t => <span key={t}>{t}</span>)}</div></div><div className="process"><div className="section-bar"><h2>工作 <em>流程</em></h2></div><ol>{[['洞察', '理解目标、受众与真实需求。'], ['策划', '确立内容方向和视觉表达。'], ['制作', '完成脚本、拍摄、剪辑与发布。'], ['复盘', '基于反馈持续优化内容效果。']].map(([title, desc], i) => <li key={title}><b>0{i + 1}</b><div><strong>{title}</strong><p>{desc}</p></div></li>)}</ol></div><div className="build-card"><p>让我们一起<br />做点有影响力<br /><em>的内容</em><br />吧。</p><a href="mailto:3522304412@qq.com">联系我 <ArrowUpRight size={16} /></a></div></section>
    <section className="contact-ref" id="contact"><div className="page contact-grid"><div><p className="mini">联系我</p><h2>一起 <em>聊聊</em></h2><p className="contact-copy">有想讲的故事、想做的内容或新的合作想法？<br />欢迎来聊聊。</p></div><div className="contact-links"><a href="mailto:3522304412@qq.com"><Mail size={18} /> 3522304412@qq.com <ArrowUpRight size={16} /></a><a href="tel:19161577041"><Sparkles size={18} /> 19161577041 <ArrowUpRight size={16} /></a><span>中国 · 2026</span></div></div></section>
    {active && <div className="modal-backdrop" onClick={() => setActive(null)}><div className="video-modal" onClick={e => e.stopPropagation()}><button className="close-modal" onClick={() => setActive(null)} aria-label="关闭"><X /></button><video src={active[3]} controls autoPlay playsInline /><div className="modal-meta"><span>{active[2]}</span><h3>{active[1]}</h3></div></div></div>}
    {import.meta.env.DEV && <Editor open={editorOpen} onClose={() => setEditorOpen(false)} settings={settings} setSettings={setSettings} works={works} setWorks={setWorks} />}
  </main>
}
createRoot(document.getElementById('root')).render(<App />)




















