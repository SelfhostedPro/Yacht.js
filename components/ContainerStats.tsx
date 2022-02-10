import React, { useState, useEffect, FC } from 'react';

interface Stats {
    data: string[]
}

const ContainerStats: FC = () => {
    const [stats, setStats] = useState<Stats>([]);
    useEffect(() => {
        let statSource = new EventSource("/api/container/localhost/peaceful_leavitt/stats")
        statSource.onmessage = e => setStats(e)
    }, [])


    return (
        <div>
            <span>{stats && stats.data}</span>
        </div>
    )

}
export { ContainerStats }

