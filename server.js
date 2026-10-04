import express from 'express';
import multer from 'multer';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express();
const PORT=process.env.PORT||3000;
const ADMIN_KEY=process.env.ADMIN_KEY||'change-me-now';
const dataDir=process.env.DATA_DIR || path.join(__dirname,'data');
const uploadDir=process.env.UPLOAD_DIR || path.join(__dirname,'uploads');
fs.mkdirSync(dataDir,{recursive:true}); fs.mkdirSync(uploadDir,{recursive:true});
const db=new Database(path.join(dataDir,'store.db'));
db.exec(`CREATE TABLE IF NOT EXISTS apps(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,slug TEXT UNIQUE NOT NULL,version TEXT,description TEXT,category TEXT,icon TEXT,apk TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
const storage=multer.diskStorage({destination:uploadDir,filename:(req,file,cb)=>cb(null,Date.now()+'-'+crypto.randomBytes(5).toString('hex')+path.extname(file.originalname).toLowerCase())});
const upload=multer({storage,limits:{fileSize:300*1024*1024},fileFilter:(req,file,cb)=>{const ext=path.extname(file.originalname).toLowerCase(); if(['.apk','.png','.jpg','.jpeg','.webp'].includes(ext)) cb(null,true); else cb(new Error('Only APK/image files are allowed.'));}});
app.use(express.json()); app.use(express.urlencoded({extended:true})); app.use(express.static(path.join(__dirname,'public'))); app.use('/uploads',express.static(uploadDir));
const slugify=s=>s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+Date.now().toString(36);
app.get('/healthz',(req,res)=>res.json({ok:true,service:'om-app-store'}));
app.get('/api/apps',(req,res)=>res.json(db.prepare('SELECT * FROM apps ORDER BY id DESC').all()));
app.get('/api/apps/:slug',(req,res)=>{const a=db.prepare('SELECT * FROM apps WHERE slug=?').get(req.params.slug); a?res.json(a):res.status(404).json({error:'Not found'});});
function auth(req,res,next){if(req.headers['x-admin-key']!==ADMIN_KEY)return res.status(401).json({error:'Invalid admin key'});next();}
app.post('/api/apps',auth,upload.fields([{name:'apk',maxCount:1},{name:'icon',maxCount:1}]),(req,res)=>{try{if(!req.files?.apk?.[0])return res.status(400).json({error:'APK required'}); const name=req.body.name?.trim(); if(!name)return res.status(400).json({error:'App name required'}); const apk='/uploads/'+req.files.apk[0].filename; const icon=req.files.icon?.[0]?'/uploads/'+req.files.icon[0].filename:'/default-icon.svg'; const slug=slugify(name); db.prepare('INSERT INTO apps(name,slug,version,description,category,icon,apk) VALUES(?,?,?,?,?,?,?)').run(name,slug,req.body.version||'1.0.0',req.body.description||'',req.body.category||'Apps',icon,apk); res.json({ok:true,slug});}catch(e){res.status(500).json({error:e.message});}});
app.delete('/api/apps/:id',auth,(req,res)=>{const a=db.prepare('SELECT * FROM apps WHERE id=?').get(req.params.id); if(!a)return res.status(404).json({error:'Not found'}); for(const f of [a.apk,a.icon])if(f&&f.startsWith('/uploads/')){try{fs.unlinkSync(path.join(__dirname,f))}catch{}} db.prepare('DELETE FROM apps WHERE id=?').run(req.params.id);res.json({ok:true});});
app.use((err,req,res,next)=>res.status(400).json({error:err.message}));
app.listen(PORT,()=>console.log(`OM APP STORE running on port ${PORT}`));
