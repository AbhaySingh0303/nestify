import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Rooms() {
  const { pgId } = useParams();
  const q = pgId ? `?pgId=${pgId}` : '';
  const [rooms, setRooms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({ roomNumber: '', capacity: '', rent: '', amenities: '' });
  const [editRoom, setEditRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, [pgId]);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/rooms${q}`);
      setRooms(res.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch rooms');
      console.error('Fetch rooms error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const formattedRoom = {
        ...newRoom,
        pgId, // Explicitly send pgId from URL
        capacity: Number(newRoom.capacity),
        rent: Number(newRoom.rent),
        amenities: newRoom.amenities ? newRoom.amenities.split(',').map(a => a.trim()).filter(a => a) : []
      };
      await api.post('/rooms', formattedRoom);
      toast.success('Room added successfully');
      setNewRoom({ roomNumber: '', capacity: '', rent: '', amenities: '' });
      setIsModalOpen(false);
      fetchRooms();
    } catch (error) {
      console.error("Room creation error:", error);
      toast.error(error.response?.data?.message || error.message || 'Failed to add room');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRoom = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const formattedRoom = {
        ...editRoom,
        pgId, // Explicitly send pgId from URL
        capacity: Number(editRoom.capacity),
        rent: Number(editRoom.rent),
        amenities: typeof editRoom.amenities === 'string' 
          ? editRoom.amenities.split(',').map(a => a.trim()).filter(a => a) 
          : editRoom.amenities
      };
      await api.put(`/rooms/${editRoom._id}`, formattedRoom);
      toast.success('Room updated successfully');
      setIsEditModalOpen(false);
      setEditRoom(null);
      fetchRooms();
    } catch (error) {
      console.error("Room update error:", error);
      toast.error(error.response?.data?.message || error.message || 'Failed to update room');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (room) => {
    setEditRoom({
      ...room,
      amenities: room.amenities.join(', ')
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      await api.delete(`/rooms/${id}`);
      toast.success('Room deleted');
      fetchRooms();
    } catch (error) {
      toast.error('Failed to delete room');
    }
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-headline font-bold text-4xl text-primary tracking-tight mb-2">Room Inventory</h2>
          <p className="font-body text-on-surface-variant">Manage and monitor all units within the property.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="primary-gradient text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add New Room
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rooms.map((room) => {
          const isFull = room.occupied >= room.capacity;
          return (
            <div key={room._id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
              <div className="relative h-40 bg-surface-container overflow-hidden">
                <img 
                  src={`https://images.unsplash.com/photo-1522771731478-444855bd6cd5?auto=format&fit=crop&q=80&w=600&h=400`} 
                  alt="Room" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 font-label text-[10px] font-bold uppercase tracking-widest rounded-full backdrop-blur-md ${isFull ? 'bg-error/90 text-on-error' : 'bg-primary-fixed/90 text-on-primary-fixed'}`}>
                    {isFull ? 'Occupied' : 'Available'}
                  </span>
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={() => openEditModal(room)} disabled={isSubmitting} className="w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-primary transition-colors disabled:opacity-50">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button onClick={() => handleDelete(room._id)} disabled={isSubmitting} className="w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-error transition-colors disabled:opacity-50">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-headline text-2xl font-extrabold tracking-tight">Unit {room.roomNumber}</h3>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm font-bold text-primary">₹{room.rent?.toLocaleString()}<span className="text-on-surface-variant text-xs font-normal"> / month</span></div>
                  <div className="flex items-center text-on-surface-variant text-xs font-bold gap-1 bg-surface-container px-2 py-1 rounded-md">
                    <span className="material-symbols-outlined text-[14px]">group</span>
                    {room.occupied}/{room.capacity}
                  </div>
                </div>
                
                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex items-start gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">check_circle</span>
                    <span className="text-xs">{(room.amenities || []).join(', ')}</span>
                  </div>
                </div>
                
                <button disabled={isSubmitting} onClick={() => openEditModal(room)} className="w-full mt-auto py-2.5 rounded-lg border border-outline text-primary text-sm font-bold hover:bg-surface-container-high transition-colors disabled:opacity-50">
                  Edit Room Details
                </button>
              </div>
            </div>
          );
        })}
        {rooms.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/30">
            <span className="material-symbols-outlined text-4xl mb-4 text-slate-300">bed</span>
            <p className="text-sm font-medium">No rooms created yet. Add your first room.</p>
          </div>
        )}
      </div>
      )}

      {/* Add Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/50">
              <h3 className="font-headline font-bold text-xl text-primary">Add New Room</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto w-full">
              <form id="add-room-form" onSubmit={handleAddRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Room Number</label>
                  <input required type="text" value={newRoom.roomNumber} onChange={e => setNewRoom({...newRoom, roomNumber: e.target.value})} className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary outline-none focus:bg-white transition-all" placeholder="e.g. 101" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Capacity</label>
                  <input required type="number" min="1" value={newRoom.capacity} onChange={e => setNewRoom({...newRoom, capacity: e.target.value})} className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary outline-none focus:bg-white transition-all" placeholder="Number of beds" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Monthly Rent (₹)</label>
                  <input required type="number" min="0" value={newRoom.rent} onChange={e => setNewRoom({...newRoom, rent: e.target.value})} className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary outline-none focus:bg-white transition-all" placeholder="e.g. 5000" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Amenities</label>
                  <input required type="text" value={newRoom.amenities} onChange={e => setNewRoom({...newRoom, amenities: e.target.value})} className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary outline-none focus:bg-white transition-all" placeholder="AC, WiFi, Attached Bath (comma separated)" />
                </div>
              </form>
            </div>
            <div className="px-6 py-5 border-t border-outline-variant/10 bg-surface-container-low/50 flex justify-end gap-3">
              <button disabled={isSubmitting} onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50">
                 Cancel
              </button>
              <button disabled={isSubmitting} type="submit" form="add-room-form" className="primary-gradient text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                 {isSubmitting ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : null}
                 Create Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {isEditModalOpen && editRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !isSubmitting && setIsEditModalOpen(false)}></div>
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/50">
              <h3 className="font-headline font-bold text-xl text-primary">Edit Room {editRoom.roomNumber}</h3>
              <button disabled={isSubmitting} onClick={() => setIsEditModalOpen(false)} className="text-on-surface-variant hover:text-primary disabled:opacity-50">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto w-full">
              <form id="edit-room-form" onSubmit={handleEditRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Room Number</label>
                  <input required type="text" value={editRoom.roomNumber} onChange={e => setEditRoom({...editRoom, roomNumber: e.target.value})} className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary outline-none focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Capacity</label>
                  <input required type="number" min="1" value={editRoom.capacity} onChange={e => setEditRoom({...editRoom, capacity: e.target.value})} className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary outline-none focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Monthly Rent (₹)</label>
                  <input required type="number" min="0" value={editRoom.rent} onChange={e => setEditRoom({...editRoom, rent: e.target.value})} className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary outline-none focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Amenities</label>
                  <input required type="text" value={editRoom.amenities} onChange={e => setEditRoom({...editRoom, amenities: e.target.value})} className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary outline-none focus:bg-white transition-all" />
                </div>
              </form>
            </div>
            <div className="px-6 py-5 border-t border-outline-variant/10 bg-surface-container-low/50 flex justify-end gap-3">
              <button disabled={isSubmitting} onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50">
                 Cancel
              </button>
              <button disabled={isSubmitting} type="submit" form="edit-room-form" className="primary-gradient text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                 {isSubmitting ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : null}
                 Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
