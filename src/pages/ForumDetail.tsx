import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { useContracts } from '../hooks/useContracts';
import { formatDate, truncateAddress } from '../utils/formatters';

interface ForumInfo {
  id: bigint;
  title: string;
  creator: string;
  createdAt: bigint;
}

interface PostInfo {
  id: bigint;
  author: string;
  cid: string;
  ts: bigint;
  score: bigint;
}

interface CommentInfo {
  id: bigint;
  postId: bigint;
  author: string;
  cid: string;
  ts: bigint;
}

export function ForumDetail() {
  const { id } = useParams();
  const forumId = id ? BigInt(id) : null;
  const nav = useNavigate();
  const contracts = useContracts();

  const [info, setInfo] = useState<ForumInfo | null>(null);
  const [posts, setPosts] = useState<PostInfo[]>([]);
  const [newPost, setNewPost] = useState('');
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  const loadForum = async () => {
    if (!contracts?.forums || forumId === null) return;
    try {
      const f = await contracts.forums.forums(forumId);
      setInfo({ id: forumId, title: f.title, creator: f.creator, createdAt: f.createdAt || BigInt(0) });
    } catch (e) { console.error(e); }
  };

  const loadPosts = async () => {
    if (!contracts?.forums || forumId === null) return;
    try {
      const ids: bigint[] = await contracts.forums.getPostsForForum(forumId);
      const list: PostInfo[] = [];
      for (const pid of ids) {
        const p = await contracts.forums.posts(pid);
        list.push({ id: pid, author: p.author, cid: p.cid, ts: p.ts, score: p.score });
      }
      list.sort((a,b)=>Number(b.ts)-Number(a.ts));
      setPosts(list);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadForum(); loadPosts(); }, [contracts, id]);

  const createPost = async () => {
    if (!contracts?.forums || forumId===null || !newPost.trim()) return;
    try {
      const tx = await contracts.forums.createPost(forumId, newPost.trim());
      await tx.wait();
      setNewPost('');
      loadPosts();
    } catch (e: any) { alert(e?.message || 'Failed to post'); }
  };

  const vote = async (postId: bigint, v: number) => {
    if (!contracts?.forums) return;
    try {
      const tx = await contracts.forums.votePost(postId, v);
      await tx.wait();
      loadPosts();
    } catch (e: any) { alert(e?.message || 'Failed to vote'); }
  };

  const createComment = async (postId: bigint) => {
    if (!contracts?.forums) return;
    const text = (commentText[String(postId)] || '').trim();
    if (!text) return;
    try {
      const tx = await contracts.forums.createComment(postId, text);
      await tx.wait();
      setCommentText(prev => ({ ...prev, [String(postId)]: '' }));
    } catch (e: any) { alert(e?.message || 'Failed to comment'); }
  };

  const deleteForum = async () => {
    if (!contracts?.forums || forumId===null) return;
    if (!confirm('Delete this forum?')) return;
    try {
      const tx = await contracts.forums.deleteForum(forumId);
      await tx.wait();
      nav('/forums');
    } catch (e: any) { alert(e?.message || 'Failed to delete'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={()=>nav('/forums')}>← Back</Button>
        <h1 className="text-2xl font-bold">Forum {info?.title || `#${id}`}</h1>
        <div className="w-20"></div>
      </div>

      {info && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              By {truncateAddress(info.creator)} · {formatDate(info.createdAt)}
            </div>
            <Button variant="danger" onClick={deleteForum}>Delete</Button>
          </div>
        </Card>
      )}

      <Card>
        <div className="space-y-2">
          <Textarea placeholder="New post content (cid/text)" value={newPost} onChange={e=>setNewPost(e.target.value)} />
          <div className="flex justify-end">
            <Button onClick={createPost} disabled={!newPost.trim()}>Post</Button>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {posts.map(p => (
          <Card key={p.id.toString()}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {truncateAddress(p.author)} · {formatDate(p.ts)}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Button variant="secondary" onClick={()=>vote(p.id, 1)}>▲</Button>
                <span className="w-8 text-center">{p.score.toString()}</span>
                <Button variant="secondary" onClick={()=>vote(p.id, -1)}>▼</Button>
              </div>
            </div>
            <div className="whitespace-pre-wrap mb-3">{p.cid}</div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input placeholder="Write a comment" value={commentText[String(p.id)]||''} onChange={e=>setCommentText(prev=>({...prev,[String(p.id)]:e.target.value}))} className="flex-1" />
                <Button onClick={()=>createComment(p.id)} disabled={!commentText[String(p.id)]?.trim()}>Reply</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
